import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Mail, Phone, User, Save, Award, Brain, Zap, Trash2 } from "lucide-react"; // Añadido Trash2
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { cvService } from '@/services/cvService.js';

function CVAnalysis({ 
  analysis: initialAnalysis, 
  userId, 
  originalFile, 
  cvDatabaseId, 
  candidateDatabaseId,
  onSaveSuccess,
  isCvSaved // Nueva prop
}) {
  const [editableAnalysis, setEditableAnalysis] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("CVAnalysis: initialAnalysis prop:", initialAnalysis);
    if (initialAnalysis && typeof initialAnalysis.then !== 'function') {
      // Asegurar que habilidades sea un objeto con tecnicas y blandas, y que tecnicas/blandas sean arrays
      const habilidades = {
        tecnicas: Array.isArray(initialAnalysis.habilidades?.tecnicas)
          ? initialAnalysis.habilidades.tecnicas
          : (Array.isArray(initialAnalysis.habilidades) ? initialAnalysis.habilidades : []), // Compatibilidad con array simple
        blandas: Array.isArray(initialAnalysis.habilidades?.blandas)
          ? initialAnalysis.habilidades.blandas
          : [],
      };

      setEditableAnalysis({
        ...initialAnalysis,
        habilidades: habilidades,
        nivel_escolarizacion: initialAnalysis.nivel_escolarizacion || initialAnalysis.title || "" // Compatibilidad con 'title' si viene de BD
      });
    } else if (initialAnalysis && typeof initialAnalysis.then === 'function') {
      initialAnalysis.then(resolved => {
        const habilidades = {
          tecnicas: Array.isArray(resolved.habilidades?.tecnicas)
            ? resolved.habilidades.tecnicas
            : (Array.isArray(resolved.habilidades) ? resolved.habilidades : []),
          blandas: Array.isArray(resolved.habilidades?.blandas)
            ? resolved.habilidades.blandas
            : [],
        };

        setEditableAnalysis({
            ...resolved,
            habilidades: habilidades,
            nivel_escolarizacion: resolved.nivel_escolarizacion || resolved.title || ""
        });
      }).catch(err => setEditableAnalysis(null));
    } else {
      setEditableAnalysis(null);
    }
  }, [initialAnalysis]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableAnalysis(prev => ({ ...prev, [name]: value }));
  };
  
  const handleHabilidadesChange = (type, e) => { // 'tecnicas' o 'blandas'
    const value = e.target.value;
    setEditableAnalysis(prev => ({
      ...prev,
      habilidades: {
        ...prev.habilidades,
        [type]: value.split(',').map(s => s.trim()).filter(Boolean)
      }
    }));
  };

  const handleSave = async () => {
    if (!editableAnalysis || !userId) {
      toast({ title: "Error de Carga", description: "No hay datos de análisis para guardar o falta el ID de usuario.", variant: "destructive" });
      return;
    }

    // Validación de campos requeridos
    const requiredFields = {
      nombre: "Nombre",
      email: "Email",
      resumen: "Resumen Profesional",
      experiencia: "Experiencia Profesional",
      nivel_escolarizacion: "Nivel de Escolarización / Título"
    };
    const missingFields = [];
    for (const field in requiredFields) {
      if (!editableAnalysis[field] || String(editableAnalysis[field]).trim() === "") {
        missingFields.push(requiredFields[field]);
      }
    }

    if (missingFields.length > 0) {
      toast({
        title: "Campos Requeridos Vacíos",
        description: `Por favor, completa los siguientes campos antes de guardar: ${missingFields.join(', ')}.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setIsSaving(true);
    
    // Preparamos el objeto analysis que se enviará al servicio, similar a como lo espera la BD
    const analysisToSave = {
        ...editableAnalysis,
        // 'skills' para la BD será la concatenación, 'habilidades' en el objeto es el estructurado
        // El servicio cvService.uploadCV ya se encarga de tomar editableAnalysis.habilidades (objeto)
        // y concatenarlo para el campo 'skills' de la tabla 'candidatos'.
        // Y toma editableAnalysis.nivel_escolarizacion para el campo 'title' de la tabla 'candidatos'.
    };
    // Aseguramos que edad sea un número para la BD
    if (analysisToSave.edad && typeof analysisToSave.edad === 'string') {
        analysisToSave.edad = parseInt(analysisToSave.edad, 10) || null;
    }


    console.log("Guardando análisis (objeto que se pasa al servicio):", analysisToSave);

    try {
      let savedCvData;
      let savedCandidateData;

      if (candidateDatabaseId && cvDatabaseId) {
        console.log("Actualizando candidato existente ID:", candidateDatabaseId);
        const candidateUpdatePayload = {
          name: analysisToSave.nombre,
          email: analysisToSave.email,
          phone: analysisToSave.telefono,
          location: analysisToSave.localidad,
          age: analysisToSave.edad,
          experience: analysisToSave.experiencia,
          skills: [ // Concatenar para la BD
            ...(analysisToSave.habilidades?.tecnicas || []),
            ...(analysisToSave.habilidades?.blandas || [])
          ].filter(Boolean),
          summary: analysisToSave.resumen,
          title: analysisToSave.nivel_escolarizacion, // Mapear a 'title'
        };
        savedCandidateData = await cvService.updateCandidate(candidateDatabaseId, candidateUpdatePayload, userId); // Pasar userId como recruiterId
        savedCvData = { id: cvDatabaseId };
        console.log("Candidato actualizado:", savedCandidateData);
      } else { 
        if (!originalFile) {
          toast({ title: "Error", description: "Falta el archivo original del CV para el primer guardado.", variant: "destructive" });
          setIsSaving(false);
          return;
        }
        console.log("Creando nuevo CV y candidato para recruiter ID:", userId);
        // cvService.uploadCV espera el objeto 'analysis' completo, y dentro de él
        // ya hemos estructurado 'habilidades' y 'nivel_escolarizacion'.
        // La función uploadCV en el servicio se encargará de mapearlos correctamente.
        const result = await cvService.uploadCV(originalFile, userId, analysisToSave);
        savedCvData = result.cv;
        savedCandidateData = result.candidate;
        console.log("Nuevo CV y candidato creados:", result);
        if (result.error) {
          // Si el servicio uploadCV manejó un error internamente y devolvió error:true
          throw new Error(result.message || "Error devuelto por el servicio de subida de CV.");
        }
      }
      
      toast({
        title: "CV Cargado con Éxito",
        description: "La información del CV y el perfil del candidato se han guardado correctamente.",
      });

      if (onSaveSuccess && savedCvData && savedCandidateData) {
        // Devolver el analysisToSave que tiene la estructura completa con nivel_escolarizacion y habilidades obj.
        onSaveSuccess(savedCvData.id, savedCandidateData.id, analysisToSave);
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

  const habilidadesTecnicasText = Array.isArray(editableAnalysis.habilidades?.tecnicas)
                                   ? editableAnalysis.habilidades.tecnicas.join(", ")
                                   : "";
  const habilidadesBlandasText = Array.isArray(editableAnalysis.habilidades?.blandas)
                                   ? editableAnalysis.habilidades.blandas.join(", ")
                                   : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Advertencia de Error de Extracción o Extracción Incompleta */}
      {(editableAnalysis.extractionError ||
        !editableAnalysis.resumen?.trim() ||
        !editableAnalysis.experiencia?.trim() ||
        editableAnalysis.nivel_escolarizacion === "No especificado" || !editableAnalysis.nivel_escolarizacion?.trim()
      ) && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6" role="alert">
          <p className="font-bold">Advertencia sobre el Análisis del CV</p>
          {editableAnalysis.extractionError ? (
            <p>{editableAnalysis.extractionMessage || "No se pudo extraer completamente el texto de este CV. Puede estar protegido, ser una imagen o estar corrupto."}</p>
          ) : (
            <p>La IA no pudo extraer toda la información relevante (ej: resumen, experiencia o nivel de escolarización). Esto puede ocurrir con formatos de CV complejos o no estándar.</p>
          )}
          <p className="mt-2 text-sm">Recomendamos revisar y completar la información manualmente para asegurar la calidad de los datos antes de guardar.</p>
        </div>
      )}

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
            <p className="text-xs text-red-600 mt-1 ml-6">*Recomendamos cambiar el teléfono a +549... y eliminar el (15) para luego poder enviarles WhatsApp al candidato.</p>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              <Input name="edad" type="number" value={editableAnalysis.edad || ""} onChange={handleChange} placeholder="Edad" className="text-[#000000] font-medium text-lg p-0 border-0 focus-visible:ring-0 h-auto w-12 text-right" /> 
              <span className="text-[#000000] font-medium text-lg ml-1">años</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nivel de Escolarización */}
      <div className="linkedin-card p-6">
        <h3 className="section-header flex items-center">
            <Award className="h-5 w-5 mr-2 text-[#0a66c2]" />
            <span>Nivel de Escolarización / Título</span>
        </h3>
        <Input 
          name="nivel_escolarizacion" 
          value={editableAnalysis.nivel_escolarizacion || ""} 
          onChange={handleChange} 
          placeholder="Ej: Licenciado en Administración, Técnico Superior..."
          className="text-[#333333] text-base mt-2" 
        />
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

      {/* Habilidades Técnicas */}
      <div className="linkedin-card p-6">
        <h3 className="section-header flex items-center">
            <Zap className="h-5 w-5 mr-2 text-[#0a66c2]" />
            <span>Habilidades Técnicas</span>
        </h3>
        <Textarea 
          name="habilidades_tecnicas"
          value={habilidadesTecnicasText}
          onChange={(e) => handleHabilidadesChange('tecnicas', e)}
          placeholder="Java, Python, React, SQL, Docker..."
          className="text-[#333333] leading-relaxed text-base mt-2 min-h-[80px]"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {(editableAnalysis.habilidades?.tecnicas || []).map((skill, index) => (
            <span key={`tech-${index}`} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Habilidades Blandas */}
      <div className="linkedin-card p-6">
        <h3 className="section-header flex items-center">
            <Brain className="h-5 w-5 mr-2 text-[#0a66c2]" />
            <span>Habilidades Blandas</span>
        </h3>
        <Textarea 
          name="habilidades_blandas"
          value={habilidadesBlandasText}
          onChange={(e) => handleHabilidadesChange('blandas', e)}
          placeholder="Comunicación, Liderazgo, Trabajo en equipo..."
          className="text-[#333333] leading-relaxed text-base mt-2 min-h-[80px]"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {(editableAnalysis.habilidades?.blandas || []).map((skill, index) => (
            <span key={`soft-${index}`} className="skill-tag">
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

      <div className="flex justify-end items-center gap-4 mt-6">
        <Button
          onClick={async () => {
            if (cvDatabaseId) {
              if (window.confirm(`¿Estás seguro de que quieres eliminar este CV y los datos del candidato asociado? Esta acción no se puede deshacer.`)) {
                setIsSaving(true); // Reutilizar isSaving para deshabilitar botones
                try {
                  // onDeleteCV se espera que venga de ProcessedCVsTab -> Dashboard
                  // y que maneje la llamada al servicio y la actualización del estado.
                  // Aquí solo invocamos la prop si existe.
                  // La lógica real de eliminación estará en Dashboard.jsx
                  if (onDeleteCV) { // onDeleteCV es la prop que vendrá de ProcessedCVsTab
                    await onDeleteCV(cvDatabaseId);
                    toast({ title: "CV Eliminado", description: "El CV y los datos del candidato han sido eliminados."});
                    // El componente se desmontará o recibirá nuevas props si la lista se actualiza en el padre.
                  } else {
                    console.warn("onDeleteCV prop no fue proporcionada a CVAnalysis");
                    toast({ title: "Error de configuración", description: "La función de eliminar no está disponible.", variant: "destructive"});
                  }
                } catch (error) {
                  console.error("Error al intentar eliminar CV desde CVAnalysis:", error);
                  toast({ title: "Error al Eliminar", description: error.message, variant: "destructive"});
                } finally {
                  setIsSaving(false);
                }
              }
            } else {
              toast({ title: "No se puede eliminar", description: "Este CV aún no ha sido guardado en la base de datos.", variant: "destructive"});
            }
          }}
          variant="destructive"
          disabled={isSaving || !cvDatabaseId}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar CV
        </Button>
        {isCvSaved ? (
          <p className="text-green-600 font-semibold flex items-center">
            <Save className="w-4 h-4 mr-2" />
            CV Guardado
          </p>
        ) : (
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default CVAnalysis;
