import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Mail, Phone, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { cvService } from '@/services/cvService.js'; // Importar el servicio

function CVAnalysis({ 
  analysis: initialAnalysis, 
  userId, 
  originalFile, 
  cvDatabaseId, 
  candidateDatabaseId,
  onSaveSuccess // Nueva prop para notificar al Dashboard
}) {
  const [editableAnalysis, setEditableAnalysis] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("CVAnalysis: initialAnalysis prop:", initialAnalysis);
    console.log("CVAnalysis: userId prop:", userId);
    console.log("CVAnalysis: originalFile prop:", originalFile?.name);
    console.log("CVAnalysis: cvDatabaseId prop:", cvDatabaseId);
    console.log("CVAnalysis: candidateDatabaseId prop:", candidateDatabaseId);

    if (initialAnalysis && typeof initialAnalysis.then !== 'function') {
      setEditableAnalysis({ ...initialAnalysis });
    } else if (initialAnalysis && typeof initialAnalysis.then === 'function') {
      initialAnalysis.then(resolved => {
        setEditableAnalysis({ ...resolved });
      }).catch(err => setEditableAnalysis(null));
    } else {
      setEditableAnalysis(null);
    }
  }, [initialAnalysis, userId, originalFile, cvDatabaseId, candidateDatabaseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableAnalysis(prev => ({ ...prev, [name]: value }));
  };
  
  const handleHabilidadesChange = (e) => {
    const value = e.target.value;
    setEditableAnalysis(prev => ({ 
      ...prev, 
      habilidades: value.split(',').map(s => s.trim()).filter(Boolean) 
    }));
  };

  const handleSave = async () => {
    if (!editableAnalysis || !userId) {
      toast({ title: "Error", description: "Faltan datos para guardar.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    console.log("Guardando análisis:", editableAnalysis);

    try {
      let savedCvData;
      let savedCandidateData;

      if (candidateDatabaseId && cvDatabaseId) { // Ya existe, entonces actualizamos
        console.log("Actualizando candidato existente ID:", candidateDatabaseId);
        const candidateUpdatePayload = {
          name: editableAnalysis.nombre,
          email: editableAnalysis.email,
          phone: editableAnalysis.telefono,
          location: editableAnalysis.localidad,
          age: parseInt(editableAnalysis.edad, 10) || null,
          experience: editableAnalysis.experiencia,
          skills: Array.isArray(editableAnalysis.habilidades) ? editableAnalysis.habilidades.join(', ') : editableAnalysis.habilidades, // Guardar como texto
          summary: editableAnalysis.resumen,
          // Aquí no actualizamos el CV en sí (tabla cvs), solo el perfil del candidato.
          // Si se quisiera actualizar el analysis_result en la tabla cvs, se necesitaría otra llamada.
        };
        savedCandidateData = await cvService.updateCandidate(candidateDatabaseId, candidateUpdatePayload);
        savedCvData = { id: cvDatabaseId }; // Asumimos que el CV no cambia, solo el candidato
        console.log("Candidato actualizado:", savedCandidateData);

      } else { // No existe, entonces creamos (uploadCV maneja la creación de ambos)
        if (!originalFile) {
          toast({ title: "Error", description: "Falta el archivo original del CV para el primer guardado.", variant: "destructive" });
          setIsSaving(false);
          return;
        }
        console.log("Creando nuevo CV y candidato para recruiter ID:", userId);
        const result = await cvService.uploadCV(originalFile, userId, editableAnalysis);
        savedCvData = result.cv;
        savedCandidateData = result.candidate;
        console.log("Nuevo CV y candidato creados:", result);
      }
      
      toast({
        title: "Guardado Exitoso",
        description: "La información del candidato ha sido guardada.",
      });

      if (onSaveSuccess && savedCvData && savedCandidateData) {
        onSaveSuccess(savedCvData.id, savedCandidateData.id, editableAnalysis);
      }

    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la información. " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!editableAnalysis) {
    return <p className="text-center p-4">Cargando análisis o datos no disponibles...</p>;
  }

  const habilidadesDisplay = Array.isArray(editableAnalysis.habilidades) 
                             ? editableAnalysis.habilidades 
                             : (typeof editableAnalysis.habilidades === 'string' ? editableAnalysis.habilidades.split(',').map(s=>s.trim()).filter(Boolean) : []);
  
  const habilidadesTextForTextarea = Array.isArray(editableAnalysis.habilidades)
                                   ? editableAnalysis.habilidades.join(", ")
                                   : (editableAnalysis.habilidades || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Información Personal */}
      <div className="linkedin-card p-6">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 bg-[#f0f7ff] rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-[#0a66c2]" />
          </div>
          <div className="flex-1 space-y-3">
            <Input name="nombre" value={editableAnalysis.nombre || ""} onChange={handleChange} placeholder="Nombre completo" className="card-title text-lg font-semibold p-0 border-0 focus-visible:ring-0 h-auto" />
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-[#0a66c2] flex-shrink-0" />
              <Input name="localidad" value={editableAnalysis.localidad || ""} onChange={handleChange} placeholder="Localidad" className="info-value text-slate-700 p-0 border-0 focus-visible:ring-0 h-auto" />
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-[#0a66c2] flex-shrink-0" />
              <Input name="email" type="email" value={editableAnalysis.email || ""} onChange={handleChange} placeholder="Email" className="info-value text-slate-700 p-0 border-0 focus-visible:ring-0 h-auto" />
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-[#0a66c2] flex-shrink-0" />
              <Input name="telefono" value={editableAnalysis.telefono || ""} onChange={handleChange} placeholder="Teléfono" className="info-value text-slate-700 p-0 border-0 focus-visible:ring-0 h-auto" />
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              <Input name="edad" type="number" value={editableAnalysis.edad || ""} onChange={handleChange} placeholder="Edad" className="text-[#000000] font-medium text-lg p-0 border-0 focus-visible:ring-0 h-auto w-12 text-right" /> 
              <span className="text-[#000000] font-medium text-lg ml-1">años</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="linkedin-card p-6">
        <h3 className="section-header">Resumen Profesional</h3>
        <Textarea 
          name="resumen" 
          value={editableAnalysis.resumen || ""} 
          onChange={handleChange} 
          placeholder="Resumen profesional del candidato..."
          className="text-[#333333] leading-relaxed text-base mt-2 min-h-[100px]" 
        />
      </div>

      {/* Habilidades */}
      <div className="linkedin-card p-6">
        <h3 className="section-header">Habilidades</h3>
        <Textarea 
          name="habilidades" // Nombre del campo para el estado
          value={habilidadesTextForTextarea} // Usar el string para el textarea
          onChange={handleHabilidadesChange} // Usar el handler que convierte a array
          placeholder="Habilidad 1, Habilidad 2, Habilidad 3..."
          className="text-[#333333] leading-relaxed text-base mt-2 min-h-[80px]"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {habilidadesDisplay.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Experiencia */}
      <div className="linkedin-card p-6">
        <h3 className="section-header flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-[#0a66c2]" />
          <span>Experiencia Profesional</span>
        </h3>
        <Textarea 
          name="experiencia" 
          value={editableAnalysis.experiencia || ""} 
          onChange={handleChange} 
          placeholder="Detalles de la experiencia laboral..."
          className="text-[#333333] leading-relaxed text-base mt-2 min-h-[150px]" 
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </motion.div>
  );
}

export default CVAnalysis;
