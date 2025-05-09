import React from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Mail, Phone, User } from "lucide-react";

function CVAnalysis({ analysis }) {
  if (!analysis) return null;

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
          <div className="flex-1">
            <h3 className="card-title">{analysis.nombre}</h3>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center text-secondary">
                <MapPin className="h-4 w-4 mr-2 text-[#0a66c2]" />
                <span className="info-value">{analysis.localidad}</span>
              </div>
              <div className="flex items-center text-secondary">
                <Mail className="h-4 w-4 mr-2 text-[#0a66c2]" />
                <span className="info-value">{analysis.email}</span>
              </div>
              <div className="flex items-center text-secondary">
                <Phone className="h-4 w-4 mr-2 text-[#0a66c2]" />
                <span className="info-value">{analysis.telefono}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[#000000] font-medium text-lg">{analysis.edad} años</span>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="linkedin-card p-6">
        <h3 className="section-header">Resumen Profesional</h3>
        <p className="text-[#333333] leading-relaxed whitespace-pre-line text-base">{analysis.resumen}</p>
      </div>

      {/* Habilidades */}
      <div className="linkedin-card p-6">
        <h3 className="section-header">Habilidades</h3>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(analysis.habilidades) && analysis.habilidades.length > 0 ? (
            analysis.habilidades.map((skill, index) => (
              <span
                key={index}
                className="skill-tag"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-500">No se especificaron habilidades.</p>
          )}
        </div>
      </div>

      {/* Experiencia */}
      <div className="linkedin-card p-6">
        <h3 className="section-header flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-[#0a66c2]" />
          <span>Experiencia Profesional</span>
        </h3>
        <div className="text-[#333333] leading-relaxed whitespace-pre-line text-base mt-4">
          {analysis.experiencia}
        </div>
      </div>
    </motion.div>
  );
}

export default CVAnalysis;
