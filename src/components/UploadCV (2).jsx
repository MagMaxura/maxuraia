
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import FileUploadZone from "@/components/FileUploadZone";
import EditableCV from "@/components/EditableCV";

function UploadCV() {
  const { toast } = useToast();
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0];
      const text = await extractTextFromFile(file);
      const analysis = await analyzeCV(text);
      
      setCvAnalysis(analysis);
      setIsEditing(true);
      
      toast({
        title: "CV procesado",
        description: "El CV ha sido analizado correctamente. Puedes editar los datos antes de guardar.",
      });
    } catch (error) {
      toast({
        title: "Error al procesar el CV",
        description: "No se pudo procesar el archivo. Asegúrate de que sea un PDF o DOCX válido.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCV = (editedAnalysis) => {
    // Por ahora guardamos en localStorage, después migraremos a Supabase
    const savedCVs = JSON.parse(localStorage.getItem('cvs') || '[]');
    const newCV = {
      id: Date.now(),
      ...editedAnalysis,
      createdAt: new Date().toISOString()
    };
    
    savedCVs.push(newCV);
    localStorage.setItem('cvs', JSON.stringify(savedCVs));
    
    setCvAnalysis(editedAnalysis);
    setIsEditing(false);
    
    toast({
      title: "CV guardado",
      description: "El CV ha sido guardado correctamente en la base de datos.",
    });
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
          />
        </motion.section>
      )}
    </div>
  );
}

export default UploadCV;
