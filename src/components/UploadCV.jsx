import React, { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "../components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "../lib/fileProcessing";
import { cvService } from "../services/cvService";
import { useAuth } from "../contexts/AuthContext";
import FileUploadZone from "./FileUploadZone";
import EditableCV from "./EditableCV";
import { Button } from "./ui/button"; // Import Button component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"; // Import Dialog components
import { ScrollArea } from "./ui/scroll-area"; // Import ScrollArea
import { Input } from "./ui/input"; // Import Input for search

// Assuming these hooks will be created or already exist for Google Auth and Drive
// import { useGoogleAuth } from "../hooks/useGoogleAuth";
// import { useGoogleDrive } from "../hooks/useGoogleDrive";

// NUEVO: Función para enviar el archivo al backend para OCR
async function extractTextFromPDFWithOCR(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ocr', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let error = { error: "Error en OCR backend" };
    try {
      error = await response.json();
    } catch (e) {}
    throw new Error(error.error || 'Error en OCR backend');
  }

  const data = await response.json();
  return data.text || '';
}

function UploadCV() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showGoogleDriveDialog, setShowGoogleDriveDialog] = useState(false);
  const [googleDriveFiles, setGoogleDriveFiles] = useState([]);
  const [googleDriveAccessToken, setGoogleDriveAccessToken] = useState(null);
  const [isListingGoogleDriveFiles, setIsListingGoogleDriveFiles] = useState(false);
  const [googleDriveSearchTerm, setGoogleDriveSearchTerm] = useState("");

  // Placeholder for Google Auth and Drive hooks
  const handleGoogleAuth = () => {
    // Redirect to Google OAuth consent screen
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    const scope = 'https://www.googleapis.com/auth/drive.readonly';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    window.location.href = authUrl;
  };

  // This effect will run when the component mounts to check for access token in URL
  React.useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Remove '#'
    const token = params.get('access_token');

    if (token) {
      setGoogleDriveAccessToken(token);
      setShowGoogleDriveDialog(true); // Open dialog to show files
      window.history.pushState("", document.title, window.location.pathname + window.location.search); // Clean URL
    }
  }, []);

  const listGoogleDriveFiles = async (accessToken) => {
    setIsListingGoogleDriveFiles(true);
    try {
      const response = await fetch(`/api/google-drive/list-files?accessToken=${accessToken}`);
      if (!response.ok) {
        throw new Error('Failed to list Google Drive files.');
      }
      const data = await response.json();
      setGoogleDriveFiles(data.files || []);
      toast({
        title: "Archivos de Google Drive cargados",
        description: `Se encontraron ${data.files.length} CVs en tu Google Drive.`,
      });
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      toast({
        title: "Error al cargar archivos de Google Drive",
        description: error.message || "No se pudieron listar los archivos.",
        variant: "destructive",
      });
    } finally {
      setIsListingGoogleDriveFiles(false);
    }
  };

  React.useEffect(() => {
    if (googleDriveAccessToken && showGoogleDriveDialog) {
      listGoogleDriveFiles(googleDriveAccessToken);
    }
  }, [googleDriveAccessToken, showGoogleDriveDialog]);


  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0];
      setUploadedFile(file);

      // PRIMERO intenta extracción local (pdfjs/mammoth)
      let text = "";
      try {
        text = await extractTextFromFile(file);
      } catch (e) {
        console.warn("Extracción local falló, se usará OCR backend.");
        text = "";
      }

      // SI NO ENCUENTRA TEXTO, MANDA AL BACKEND OCR
      if (!text || text.trim().length < 10) {
        text = await extractTextFromPDFWithOCR(file); // Usa la función de arriba
      }

      const analysis = await analyzeCV(text);
      console.log("UploadCV: Análisis del CV:", analysis);

      setCvAnalysis(analysis);
      setIsEditing(true);

      toast({
        title: "CV procesado",
        description: "El CV ha sido analizado correctamente. Puedes editar los datos antes de guardar.",
      });
    } catch (error) {
      console.error('Error al procesar el CV:', error);
      toast({
        title: "Error al procesar el CV",
        description: "No se pudo procesar el archivo. Asegúrate de que sea un PDF o DOCX válido.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCV = async (editedAnalysis) => {
    setIsSaving(true); // Iniciar el estado de guardado
    try {
      if (!uploadedFile || !user?.id) {
        throw new Error('Falta archivo o usuario');
      }

      const result = await cvService.uploadCV(uploadedFile, user.id, editedAnalysis);

      setCvAnalysis(editedAnalysis);
      setIsEditing(false);
      setUploadedFile(null);

      toast({
        title: "CV guardado",
        description: "El CV ha sido guardado correctamente en la base de datos.",
      });

      return result;
    } catch (error) {
      console.error('Error al guardar el CV:', error);
      toast({
        title: "Error al guardar",
        description: `No se pudo guardar el CV: ${error.message || "Error desconocido"}. Por favor, inténtalo de nuevo.`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false); // Finalizar el estado de guardado
    }
  };

  const handleGoogleDriveFileSelect = async (fileId, fileName, mimeType) => {
    setIsProcessing(true);
    setShowGoogleDriveDialog(false); // Close the dialog
    try {
      const response = await fetch(`/api/google-drive/download-file?fileId=${fileId}&accessToken=${googleDriveAccessToken}`);
      if (!response.ok) {
        throw new Error('Failed to download file from Google Drive.');
      }

      // Get the file as a Blob
      const blob = await response.blob();
      // Create a File object from the Blob
      const file = new File([blob], fileName, { type: mimeType });

      setUploadedFile(file);

      let text = "";
      try {
        text = await extractTextFromFile(file);
      } catch (e) {
        console.warn("Extracción local falló, se usará OCR backend.");
        text = "";
      }

      if (!text || text.trim().length < 10) {
        text = await extractTextFromPDFWithOCR(file);
      }

      const analysis = await analyzeCV(text);
      console.log("UploadCV: Análisis del CV:", analysis);

      setCvAnalysis(analysis);
      setIsEditing(true);

      toast({
        title: "CV procesado",
        description: "El CV de Google Drive ha sido analizado correctamente. Puedes editar los datos antes de guardar.",
      });

    } catch (error) {
      console.error('Error al procesar el CV de Google Drive:', error);
      toast({
        title: "Error al procesar el CV de Google Drive",
        description: "No se pudo procesar el archivo. Asegúrate de que sea un PDF o DOCX válido.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredGoogleDriveFiles = googleDriveFiles.filter(file =>
    file.name.toLowerCase().includes(googleDriveSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="linkedin-section p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cargar nuevo CV</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <FileUploadZone
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg w-full md:w-1/2 text-center">
            <p className="text-gray-500 mb-4">O carga desde Google Drive</p>
            <Button
              onClick={() => {
                if (googleDriveAccessToken) {
                  setShowGoogleDriveDialog(true);
                } else {
                  handleGoogleAuth();
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Cargando..." : "Cargar desde Google Drive"}
            </Button>
          </div>
        </div>
      </motion.section>

      {cvAnalysis && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="linkedin-section p-6"
        >
          <EditableCV
            analysis={cvAnalysis}
            onSave={handleSaveCV}
            isSaving={isSaving}
          />
        </motion.section>
      )}

      <Dialog open={showGoogleDriveDialog} onOpenChange={setShowGoogleDriveDialog}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar CV de Google Drive</DialogTitle>
            <DialogDescription>
              Selecciona un archivo PDF o DOCX de tu Google Drive.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Buscar archivos..."
            value={googleDriveSearchTerm}
            onChange={(e) => setGoogleDriveSearchTerm(e.target.value)}
            className="mb-4"
          />
          {isListingGoogleDriveFiles ? (
            <div className="flex justify-center items-center h-full">
              <p>Cargando archivos...</p>
            </div>
          ) : (
            <ScrollArea className="flex-grow pr-4">
              {filteredGoogleDriveFiles.length > 0 ? (
                <ul className="space-y-2">
                  {filteredGoogleDriveFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleGoogleDriveFileSelect(file.id, file.name, file.mimeType)}
                    >
                      <span>{file.name}</span>
                      <span className="text-sm text-gray-500">{file.mimeType.includes('pdf') ? 'PDF' : 'DOCX'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">No se encontraron archivos PDF o DOCX.</p>
              )}
            </ScrollArea>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowGoogleDriveDialog(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UploadCV;
