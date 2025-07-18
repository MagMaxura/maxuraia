import React, { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "../components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "../lib/fileProcessing";
import { cvService } from "../services/cvService";
import { useAuth } from "../contexts/AuthContext";
import FileUploadZone from "./FileUploadZone";
import EditableCV from "./EditableCV";

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
  const [isSaving, setIsSaving] = useState(false); // Nuevo estado para el guardado

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

  return (
    <div className="space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="linkedin-section p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cargar nuevo CV</h2>
        <FileUploadZone 
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />
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
            isSaving={isSaving} // Pasar el estado isSaving a EditableCV
          />
        </motion.section>
      )}
    </div>
  );
}

export default UploadCV;
