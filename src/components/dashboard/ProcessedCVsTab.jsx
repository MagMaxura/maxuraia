import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CVAnalysis from "@/components/CVAnalysis.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Trash2 } from 'lucide-react'; // Asegurarse de que Trash2 esté importado

function ProcessedCVsTab({
  cvFiles,
  selectedCV,
  handleCVClick,
  cvAnalysis,
  isLoadingCVs,
  isProcessing,
  userId,
  onSaveSuccess,
  // Props para filtros
  cvFilters,
  onCvFilterChange,
  onDeleteCV, // Añadir onDeleteCV a la desestructuración de props
}) {

  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    onCvFilterChange(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const filteredCvFiles = useMemo(() => {
    if (!cvFiles) return [];
    return cvFiles.filter(cvFile => {
      const analysis = cvFile.analysis;
      if (!analysis) return false; // Si no hay análisis, no se puede filtrar

      // Filtro por Rango de Edad
      const age = parseInt(analysis.edad, 10);
      if (cvFilters.ageMin && (isNaN(age) || age < parseInt(cvFilters.ageMin, 10))) return false;
      if (cvFilters.ageMax && (isNaN(age) || age > parseInt(cvFilters.ageMax, 10))) return false;

      // Filtro por Título (Nivel de Escolarización)
      if (cvFilters.title && (!analysis.nivel_escolarizacion || !analysis.nivel_escolarizacion.toLowerCase().includes(cvFilters.title.toLowerCase()))) return false;
      
      // Filtro por Localidad
      if (cvFilters.location && (!analysis.localidad || !analysis.localidad.toLowerCase().includes(cvFilters.location.toLowerCase()))) return false;

      // Filtro por Palabras Clave en Experiencia
      if (cvFilters.experienceKeywords && (!analysis.experiencia || !analysis.experiencia.toLowerCase().includes(cvFilters.experienceKeywords.toLowerCase()))) return false;
      
      // Filtro por Habilidades (busca en habilidades técnicas y blandas)
      if (cvFilters.skills) {
        const searchSkills = cvFilters.skills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        const candidateSkills = [
          ...(analysis.habilidades?.tecnicas || []),
          ...(analysis.habilidades?.blandas || [])
        ].map(s => s.toLowerCase());
        
        if (!searchSkills.every(searchSkill => candidateSkills.some(cs => cs.includes(searchSkill)))) return false;
      }
      
      return true;
    });
  }, [cvFiles, cvFilters]);

  const clearFilters = () => {
    onCvFilterChange({
      ageMin: '',
      ageMax: '',
      title: '',
      experienceKeywords: '',
      skills: '',
      location: '',
    });
  };


  return (
    <div className="flex flex-col md:flex-row gap-6 h-full"> {/* Contenedor principal Flexbox */}
      {/* Columna Izquierda/Principal para el Análisis del CV */}
      <div className="flex-grow md:w-2/3 space-y-6"> {/* Ocupa 2/3 del espacio en pantallas medianas y grandes */}
        {cvAnalysis && selectedCV !== null && cvFiles[selectedCV] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-xl h-full" // h-full para ocupar altura disponible
          >
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Análisis del CV: {cvFiles[selectedCV]?.name}
            </h2>
            <CVAnalysis
              analysis={cvAnalysis}
              userId={userId}
              originalFile={cvFiles[selectedCV]?.originalFile}
              cvDatabaseId={cvFiles[selectedCV]?.cv_database_id}
              candidateDatabaseId={cvFiles[selectedCV]?.candidate_database_id}
              onSaveSuccess={onSaveSuccess}
              onDeleteCV={onDeleteCV}
            />
          </motion.div>
        )}
        {!isLoadingCVs && selectedCV === null && cvFiles.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-xl text-center text-slate-500 h-full flex items-center justify-center">
             <p>Selecciona un CV de la lista de la derecha para ver su análisis.</p>
          </div>
        )}
         {!isLoadingCVs && cvFiles.length === 0 && (
           <div className="bg-white p-6 rounded-xl shadow-xl text-center text-slate-500 h-full flex items-center justify-center">
            <p>No hay CVs procesados o guardados todavía.</p>
           </div>
        )}
        {isLoadingCVs && (
            <div className="bg-white p-6 rounded-xl shadow-xl text-center text-slate-500 h-full flex items-center justify-center">
                <p>Cargando CVs guardados...</p>
            </div>
        )}
      </div>

      {/* Columna Derecha para Filtros y Lista de CVs */}
      <motion.div
        initial={{ opacity: 0, x: 20 }} // Animación desde la derecha
        animate={{ opacity: 1, x: 0 }}
        className="md:w-1/3 bg-white p-6 rounded-xl shadow-xl space-y-4 flex flex-col h-full" // Ocupa 1/3 y es una columna flex
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-2 flex-shrink-0">Lista de CVs</h2>

        {/* Sección de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border rounded-md bg-slate-50">
          <div>
            <label htmlFor="filterAgeMin" className="text-sm font-medium text-gray-700">Edad Mín.</label>
            <Input type="number" name="ageMin" id="filterAgeMin" value={cvFilters.ageMin} onChange={handleFilterInputChange} placeholder="Ej: 25" className="mt-1 text-sm" />
          </div>
          <div>
            <label htmlFor="filterAgeMax" className="text-sm font-medium text-gray-700">Edad Máx.</label>
            <Input type="number" name="ageMax" id="filterAgeMax" value={cvFilters.ageMax} onChange={handleFilterInputChange} placeholder="Ej: 40" className="mt-1 text-sm" />
          </div>
          <div>
            <label htmlFor="filterTitle" className="text-sm font-medium text-gray-700">Título/Escolaridad</label>
            <Input name="title" id="filterTitle" value={cvFilters.title} onChange={handleFilterInputChange} placeholder="Ej: Ingeniero, Licenciado" className="mt-1 text-sm" />
          </div>
          <div>
            <label htmlFor="filterLocation" className="text-sm font-medium text-gray-700">Localidad</label>
            <Input name="location" id="filterLocation" value={cvFilters.location} onChange={handleFilterInputChange} placeholder="Ej: Buenos Aires" className="mt-1 text-sm" />
          </div>
          <div>
            <label htmlFor="filterSkills" className="text-sm font-medium text-gray-700">Habilidades (separadas por coma)</label>
            <Input name="skills" id="filterSkills" value={cvFilters.skills} onChange={handleFilterInputChange} placeholder="Ej: React, Liderazgo" className="mt-1 text-sm" />
          </div>
          <div>
            <label htmlFor="filterExperienceKeywords" className="text-sm font-medium text-gray-700">Palabras en Experiencia</label>
            <Input name="experienceKeywords" id="filterExperienceKeywords" value={cvFilters.experienceKeywords} onChange={handleFilterInputChange} placeholder="Ej: gestión de proyectos" className="mt-1 text-sm" />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex justify-end">
            <Button variant="ghost" onClick={clearFilters} className="text-sm">Limpiar Filtros</Button>
          </div>
        </div>

        {/* Mensajes de carga/vacío para la lista de CVs */}
        {isLoadingCVs && !cvFiles.length && ( // Mostrar solo si no hay CVs aún para evitar duplicar mensaje de carga principal
          <p className="text-slate-500 text-sm text-center py-4">Cargando...</p>
        )}
        {!isLoadingCVs && filteredCvFiles.length === 0 && cvFiles.length > 0 && (
           <p className="text-slate-500 text-sm text-center py-4">Ningún CV coincide con los filtros.</p>
        )}
        {/* No mostrar "No hay CVs" aquí si el panel principal ya lo dice */}

        <div className="space-y-2 overflow-y-auto flex-grow"> {/* flex-grow para que la lista ocupe espacio */}
          {filteredCvFiles.map((file, index) => {
            // Para que handleCVClick funcione con el índice correcto del array original cvFiles
            const originalIndex = cvFiles.findIndex(originalFile => (originalFile.cv_database_id || originalFile.name) === (file.cv_database_id || file.name));
            return (
              <div
                key={file.cv_database_id || index} 
                className={`p-3 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                  selectedCV === originalIndex // Comparar con el índice original
                  ? "bg-blue-100 border-blue-300"
                  : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                }`}
                onClick={() => handleCVClick(originalIndex)}
              >
                <div className="flex-grow truncate mr-2"> {/* Añadido mr-2 para espacio */}
                  <span className="text-slate-700 font-medium" title={file.name}>{file.name}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                  {file.uploadedDate && (
                    <span className="text-xs text-slate-500 mr-3">
                      {new Date(file.uploadedDate).toLocaleDateString()}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (file.cv_database_id && onDeleteCV) { // Verificar que onDeleteCV exista
                        if (window.confirm(`¿Estás seguro de que quieres eliminar el CV "${file.name}"? Esta acción no se puede deshacer.`)) {
                          onDeleteCV(file.cv_database_id);
                        }
                      } else {
                        console.warn("Intento de eliminar CV sin ID de BD o función onDeleteCV no disponible:", file);
                      }
                    }}
                    title="Eliminar CV"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
      {/* El panel de CVAnalysis ya se movió a la columna izquierda/principal */}
    </div>
  );
}

export default ProcessedCVsTab;