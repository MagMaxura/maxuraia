
import React from "react";
import { motion } from "framer-motion";

function CVAnalysis({ analysis }) {
  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 p-6 rounded-lg space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-white font-semibold mb-2">Información Personal</h3>
          <div className="space-y-2 text-gray-200">
            <p><span className="text-gray-400">Nombre:</span> {analysis.nombre}</p>
            <p><span className="text-gray-400">Edad:</span> {analysis.edad}</p>
            <p><span className="text-gray-400">Email:</span> {analysis.email}</p>
            <p><span className="text-gray-400">Teléfono:</span> {analysis.telefono}</p>
            <p><span className="text-gray-400">Localidad:</span> {analysis.localidad}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-2">Habilidades</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.habilidades.map((skill, index) => (
              <span
                key={index}
                className="bg-white/10 px-3 py-1 rounded-full text-sm text-gray-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">Experiencia</h3>
        <div className="text-gray-200 whitespace-pre-line">
          {analysis.experiencia}
        </div>
      </div>
    </motion.div>
  );
}

export default CVAnalysis;
