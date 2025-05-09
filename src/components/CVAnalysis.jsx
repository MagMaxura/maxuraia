import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Mail, Phone, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

// Asumimos que tienes un servicio para interactuar con Supabase
// import { saveCandidateProfile, saveCvDocument } from '@/services/candidateService'; 

function CVAnalysis({ analysis: initialAnalysis }) {
  const [editableAnalysis, setEditableAnalysis] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Podríamos añadir un botón "Editar" en el futuro
  const { toast } = useToast();

  useEffect(() => {
    console.log("CVAnalysis component received initialAnalysis prop:", initialAnalysis);
    if (initialAnalysis && typeof initialAnalysis.then !== 'function') {
      setEditableAnalysis({ ...initialAnalysis });
    } else if (initialAnalysis && typeof initialAnalysis.then === 'function') {
      console.warn("CVAnalysis: initialAnalysis prop is a Promise. Waiting for it to resolve.");
      initialAnalysis.then(resolved => {
        console.log("CVAnalysis: Promise resolved, setting editableAnalysis", resolved);
        setEditableAnalysis({ ...resolved });
      }).catch(err => {
        console.error("CVAnalysis: Error resolving promise for initialAnalysis", err);
        setEditableAnalysis(null); // o algún estado de error
      });
    } else {
      setEditableAnalysis(null);
    }
  }, [initialAnalysis]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableAnalysis(prev => ({ ...prev, [name]: value }));
  };

  const handleHabilidadesChange = (e) => {
    // Para habilidades como array, si se editan en un textarea, se guardan como string.
    // O se podría implementar una lógica más compleja para tags.
    // Por ahora, si es un array lo unimos, si es string lo tomamos.
    const value = e.target.value;
    setEditableAnalysis(prev => ({ 
      ...prev, 
      habilidades: Array.isArray(prev.habilidades) ? value.split(',').map(s => s.trim()) : value 
    }));
  };
  
  // Lógica para cuando se editan las habilidades directamente en el array (si se implementan tags)
  const handleHabilidadesArrayChange = (newHabilidadesArray) => {
    setEditableAnalysis(prev => ({ ...prev, habilidades: newHabilidadesArray }));
  };


  const handleSave = async () => {
    if (!editableAnalysis) return;
    console.log("Guardando análisis:", editableAnalysis);

    try {
      // Aquí iría la lógica para guardar en Supabase
      // Ejemplo (necesitarás implementar estas funciones en tu servicio):
      // const candidateData = {
      //   nombre: editableAnalysis.nombre,
      //   email: editableAnalysis.email,
      //   telefono: editableAnalysis.telefono,
      //   localidad: editableAnalysis.localidad,
      //   edad: editableAnalysis.edad,
      //   resumen_profesional: editableAnalysis.resumen,
      //   // ... otros campos para la tabla Candidatos
      // };
      // await saveCandidateProfile(candidateData);

      // Si también necesitas guardar el CV (archivo o referencia)
      // await saveCvDocument({ cvText: editableAnalysis.textoCompleto, originalFileName: initialAnalysis.originalFileName /* o similar */ });
      
      toast({
        title: "Guardado",
        description: "La información del candidato ha sido guardada.",
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la información. " + error.message,
        variant: "destructive",
      });
    }
  };

  if (!editableAnalysis) {
    console.log("CVAnalysis: editableAnalysis is null. Rendering null or loading.");
    return <p className="text-center p-4">Cargando análisis o datos no disponibles...</p>;
  }

  // Asegurarse de que habilidades sea un array para el mapeo, o un string para el textarea
  const habilidadesDisplay = Array.isArray(editableAnalysis.habilidades) 
                             ? editableAnalysis.habilidades 
                             : (typeof editableAnalysis.habilidades === 'string' ? editableAnalysis.habilidades.split(',').map(s=>s.trim()) : []);
  const habilidadesText = Array.isArray(editableAnalysis.habilidades) 
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
              <Input name="edad" value={editableAnalysis.edad || ""} onChange={handleChange} placeholder="Edad" className="text-[#000000] font-medium text-lg p-0 border-0 focus-visible:ring-0 h-auto w-12 text-right" /> 
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
        {/* <Textarea 
          name="habilidades"
          value={habilidadesText}
          onChange={handleHabilidadesChange}
          placeholder="Habilidad 1, Habilidad 2, Habilidad 3..."
          className="text-[#333333] leading-relaxed text-base mt-2 min-h-[80px]"
        /> */}
        {/* Alternativa: Mostrar como tags si es un array, o permitir edición más compleja */}
        <div className="flex flex-wrap gap-2 mt-2">
          {habilidadesDisplay.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
         <p className="text-xs text-slate-400 mt-2">La edición de habilidades como tags individuales se implementará. Por ahora, se guardará el texto completo si se modifica el campo de habilidades en el futuro.</p>

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
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>
    </motion.div>
  );
}

export default CVAnalysis;
