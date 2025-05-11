import React from 'react';
import { motion } from 'framer-motion';
import { FileUp } from 'lucide-react';

function UploadCVTab({
  handleFileUpload,
  fileInputRef,
  isBulkProcessing,
  isProcessing, // Estado general de procesamiento de CV
  totalFilesToUpload,
  filesUploadedCount,
  currentFileProcessingName,
  handleDragOver,
  handleDrop,
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Cargar nuevo CV</h2>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
          disabled={isBulkProcessing || isProcessing}
        />
        <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-slate-700 font-medium text-base md:text-lg mb-1">
          Arrastra y suelta tus CVs aquí, o haz clic para seleccionar
        </p>
        <p className="text-xs text-slate-500">
          Formatos aceptados: PDF, DOC, DOCX. Puedes seleccionar múltiples archivos.
        </p>
        {isProcessing && !isBulkProcessing && <p className="mt-4 text-blue-600">Procesando CV individual...</p>}
      </div>
      {isBulkProcessing && (
        <div className="mt-6 w-full">
          <p className="text-sm text-slate-700 mb-1 text-center">
            Procesando lote: {currentFileProcessingName ? `Analizando ${currentFileProcessingName}...` : 'Iniciando...'}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="bg-blue-600 h-6 rounded-full text-xs font-medium text-blue-100 text-center p-1 leading-none transition-all duration-300 ease-in-out"
              style={{ width: totalFilesToUpload > 0 ? `${(filesUploadedCount / totalFilesToUpload) * 100}%` : '0%' }}
            >
              {totalFilesToUpload > 0 ? `${filesUploadedCount} / ${totalFilesToUpload}` : ''}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default UploadCVTab;