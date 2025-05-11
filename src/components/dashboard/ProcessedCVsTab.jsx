import React from 'react';
import { motion } from 'framer-motion';
import CVAnalysis from "@/components/CVAnalysis.jsx"; // Asegúrate que la ruta sea correcta

function ProcessedCVsTab({
  cvFiles,
  selectedCV,
  handleCVClick,
  cvAnalysis,
  isLoadingCVs,
  isProcessing, // Para el mensaje "No hay CVs procesados todavía."
  // Props necesarias para CVAnalysis
  userId,
  onSaveSuccess,
}) {
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="bg-white p-6 rounded-xl shadow-xl"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-4">CVs Procesados</h2>
        {isLoadingCVs && (
          <p className="text-slate-500 text-sm text-center py-4">Cargando CVs guardados...</p>
        )}
        {!isLoadingCVs && cvFiles.length === 0 && (
          // Considerar si isProcessing (de la carga individual) también debe afectar este mensaje
          <p className="text-slate-500 text-sm text-center py-4">No hay CVs procesados o guardados todavía.</p>
        )}
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {cvFiles.map((file, index) => (
            <div
              key={file.cv_database_id || index} // Usar un ID de BD si está disponible, sino el índice
              className={`p-3 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                selectedCV === index
                ? "bg-blue-100 border-blue-300"
                : "bg-slate-50 hover:bg-slate-100 border border-transparent"
              }`}
              onClick={() => handleCVClick(index)}
            >
              <span className="text-slate-700 font-medium truncate" title={file.name}>{file.name}</span>
              {file.uploadedDate && (
                <span className="text-xs text-slate-500">
                  {new Date(file.uploadedDate).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {cvAnalysis && selectedCV !== null && cvFiles[selectedCV] && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="bg-white p-6 rounded-xl shadow-xl"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Análisis del CV: {cvFiles[selectedCV]?.name}
          </h2>
          <CVAnalysis
            analysis={cvAnalysis}
            userId={userId}
            originalFile={cvFiles[selectedCV]?.originalFile} // Puede ser null para CVs de BD
            cvDatabaseId={cvFiles[selectedCV]?.cv_database_id}
            candidateDatabaseId={cvFiles[selectedCV]?.candidate_database_id}
            onSaveSuccess={onSaveSuccess}
          />
        </motion.div>
      )}
      {!isLoadingCVs && selectedCV === null && cvFiles.length > 0 && (
        <p className="text-slate-500 text-center py-4">Selecciona un CV de la lista para ver su análisis.</p>
      )}
    </div>
  );
}

export default ProcessedCVsTab;