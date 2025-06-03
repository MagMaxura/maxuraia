import React, { useState } from "react"; // Eliminar useEffect
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
// Eliminar useAuth y cvService si no se usan localmente
// import { useAuth } from "../contexts/AuthContext";
// import { cvService } from "../services/cvService";
import CVAnalysis from "./CVAnalysis";

// Aceptar props de ProcessedCVsTab
function ProcessedCVs({
  cvFiles, // Ahora viene como prop
  selectedCV, // Ahora viene como prop (índice)
  handleCVClick, // Ahora viene como prop
  cvAnalysis, // Ahora viene como prop
  isLoadingCVs, // Ahora viene como prop
  isProcessing, // Ahora viene como prop (para el botón de guardar todos)
  userId, // Ahora viene como prop
  onDeleteCV, // Ahora viene como prop
  cvFilters, // Ahora viene como prop
  onCvFilterChange, // Ahora viene como prop
  hasUnsavedCVs, // Nueva prop
  onSaveAllCVs, // Nueva prop
}) {
  // const { user } = useAuth(); // Eliminar si no se usa
  const { toast } = useToast();
  // Eliminar estado local de cvs y useEffect de carga
  // const [cvs, setCvs] = useState([]);
  // const [selectedCV, setSelectedCV] = useState(null); // Ahora viene como prop
  const [searchTerm, setSearchTerm] = useState("");
  // const [isLoading, setIsLoading] = useState(true); // Ahora viene como prop isLoadingCVs

  // Eliminar useEffect de carga inicial
  // useEffect(() => {
  //   loadCVs();
  // }, [user?.id]);

  // Eliminar loadCVs
  // const loadCVs = async () => { ... };

  // Eliminar handleDeleteCV
  // const handleDeleteCV = async (cvId) => { ... };

  // Filtrado ahora usa la prop cvFiles
  const filteredCVs = cvFiles.filter(cvFile => {
    // Asumimos que el análisis ya está en cvFile.analysis
    const analysis = cvFile.analysis;
    if (!analysis) return false;

    const searchLower = searchTerm.toLowerCase();
    // Buscar en nombre y habilidades del análisis
    const nameMatch = analysis.nombre?.toLowerCase().includes(searchLower) || analysis.name?.toLowerCase().includes(searchLower);
    const skillsMatch = analysis.habilidades?.tecnicas?.some(skill => skill.toLowerCase().includes(searchLower)) || analysis.habilidades?.blandas?.some(skill => skill.toLowerCase().includes(searchLower));

    return nameMatch || skillsMatch;
  });

  // Usar isLoadingCVs de las props
  if (isLoadingCVs) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="linkedin-section p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">CVs Procesados</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o habilidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Advertencia y botón de guardar todos - Usar la prop hasUnsavedCVs */}
        {hasUnsavedCVs && (
          <div className="flex items-center justify-between bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Advertencia</p>
            <p>Hay CVs sin guardar.</p>
            {/* Conectar el botón con la prop onSaveAllCVs */}
            <Button onClick={onSaveAllCVs} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded" disabled={isProcessing}>
              {isProcessing ? 'Guardando...' : 'Guardar todos'}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Iterar sobre filteredCVs (que ahora usa cvFiles) */}
          {filteredCVs.map((cvFile, index) => {
            const analysis = cvFile.analysis;
            if (!analysis) return null;

            // Determinar si el CV está guardado para el color
            const isSaved = (cvFile.cv_database_id && cvFile.cv_database_id !== 'temp-cv-id-error') || cvFile.candidate_database_id;

            return (
              <motion.div
                // Usar una key única, preferiblemente el ID de BD si existe, o el índice si no
                key={cvFile.cv_database_id || `temp-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  // Comparar con el índice seleccionado
                  selectedCV === index
                    ? "bg-blue-50 border-2 border-blue-500" // Seleccionado
                    : isSaved
                      ? "bg-green-50 border border-green-300 hover:shadow-md" // Guardado (verde)
                      : "bg-red-50 border border-red-300 hover:shadow-md" // No guardado (rojo)
                }`}
                // Usar la prop handleCVClick y pasar el índice
                onClick={() => handleCVClick(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      {/* Mostrar nombre del análisis */}
                      <h3 className="font-medium text-gray-900">{analysis.nombre || analysis.name || 'Nombre no disponible'}</h3>
                      {/* Mostrar fecha de subida si existe */}
                      {cvFile.uploadedDate && (
                        <p className="text-sm text-gray-500">
                          {new Date(cvFile.uploadedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {/* Botón Ver detalles - usa handleCVClick */}
                    <Button
                      variant="ghost"
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que el clic en el botón seleccione el CV
                        handleCVClick(index); // Seleccionar el CV para mostrar detalles
                      }}
                    >
                      Ver detalles
                    </Button>
                    {/* Botón Eliminar - usa la prop onDeleteCV */}
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Llamar a la prop onDeleteCV con el ID de BD si existe
                        if (cvFile.cv_database_id && onDeleteCV) {
                           if (window.confirm(`¿Estás seguro de que quieres eliminar el CV "${cvFile.name}"? Esta acción no se puede deshacer.`)) {
                             onDeleteCV(cvFile.cv_database_id);
                           }
                        } else {
                           toast({ title: "Error", description: "No se puede eliminar un CV sin guardar permanentemente desde aquí.", variant: "destructive" });
                        }
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Mensaje si no hay CVs filtrados */}
          {filteredCVs.length === 0 && !isLoadingCVs && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron CVs que coincidan con tu búsqueda.
            </div>
          )}
           {/* Mensaje si no hay CVs en absoluto */}
           {cvFiles.length === 0 && !isLoadingCVs && (
            <div className="text-center py-8 text-gray-500">
              No hay CVs procesados o guardados todavía.
            </div>
          )}
        </div>
      </motion.section>

      {/* Sección de Análisis del CV - Usar la prop cvAnalysis */}
      {selectedCV !== null && cvFiles[selectedCV] && cvAnalysis && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="linkedin-section p-6"
        >
          {/* Pasar el análisis del CV seleccionado */}
          <CVAnalysis analysis={cvAnalysis} />
        </motion.section>
      )}
    </div>
  );
}

// Eliminar la función placeholder handleSaveAllCVs
// const handleSaveAllCVs = async () => { ... };

export default ProcessedCVs;
