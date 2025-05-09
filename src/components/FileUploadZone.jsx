import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

function FileUploadZone({ onFileUpload, isProcessing }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      onFileUpload({ target: { files: acceptedFiles } });
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    disabled: isProcessing,
    multiple: false
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8
          transition-colors duration-200 ease-in-out
          cursor-pointer flex flex-col items-center justify-center
          ${isDragActive 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <Upload className={`w-12 h-12 mb-4 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
        <p className="text-gray-700 text-center text-lg mb-2 font-medium">
          {isDragActive
            ? "Suelta el archivo aquí..."
            : "Arrastra y suelta tu CV aquí, o haz clic para seleccionar"}
        </p>
        <p className="text-gray-500 text-sm text-center">
          {isProcessing 
            ? "Procesando archivo..."
            : "Formatos aceptados: PDF, DOC, DOCX"}
        </p>
      </div>
    </motion.div>
  );
}

export default FileUploadZone;
