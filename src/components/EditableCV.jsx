import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Save, Plus, X, MessageCircle } from "lucide-react"; // Importar MessageCircle

function EditableCV({ analysis, onSave, isSaving, readOnly = false }) { // Añadir prop readOnly
  const [editedAnalysis, setEditedAnalysis] = useState(analysis);
  const [tempPhoneNumber, setTempPhoneNumber] = useState(analysis.telefono || ''); // Nuevo estado para el número temporal

  const handleInputChange = (field, value) => {
    setEditedAnalysis(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...editedAnalysis.habilidades];
    newSkills[index] = value;
    handleInputChange('habilidades', newSkills);
  };

  const addSkill = () => {
    handleInputChange('habilidades', [...editedAnalysis.habilidades, '']);
  };

  const removeSkill = (index) => {
    const newSkills = editedAnalysis.habilidades.filter((_, i) => i !== index);
    handleInputChange('habilidades', newSkills);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold text-[#000000] mb-6">
          {readOnly ? "Perfil del Candidato" : "Editar CV"}
        </h2>
        
        {/* Información Personal */}
        <div className="bg-[#f3f2ef] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-[#000000] mb-4">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Nombre</label>
              {readOnly ? (
                <p className="text-base text-gray-800">{editedAnalysis.nombre || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  value={editedAnalysis.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className="input-field"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Edad</label>
              {readOnly ? (
                <p className="text-base text-gray-800">{editedAnalysis.edad || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  value={editedAnalysis.edad}
                  onChange={(e) => handleInputChange('edad', e.target.value)}
                  className="input-field"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Localidad</label>
              {readOnly ? (
                <p className="text-base text-gray-800">{editedAnalysis.localidad || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  value={editedAnalysis.localidad}
                  onChange={(e) => handleInputChange('localidad', e.target.value)}
                  className="input-field"
                />
              )}
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#000000] mb-1">Email</label>
            {readOnly ? (
              <p className="text-base text-gray-800">{editedAnalysis.email || 'N/A'}</p>
            ) : (
              <input
                type="email"
                value={editedAnalysis.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-field"
              />
            )}
          </div>

          {/* Teléfono */}
          <div className="mb-6"> {/* Añadir mb-6 para espacio con la siguiente sección */}
            <label className="block text-sm font-medium text-[#000000] mb-1">Teléfono</label>
            <p className="text-base text-gray-800 mb-2">{editedAnalysis.telefono || 'N/A'}</p> {/* Siempre mostrar el teléfono original */}

            {/* Nuevo campo para el número de WhatsApp */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempPhoneNumber}
                onChange={(e) => setTempPhoneNumber(e.target.value)}
                className="input-field flex-grow"
                placeholder="coloca aquí el numero de telefono en este formato 549XXXXXXXXXX (sin 15)"
              />
              <a
                href={`https://web.whatsapp.com/send?phone=${tempPhoneNumber || editedAnalysis.telefono}&text=Hola%20te%20contacto%20por%20un%20puesto%20de%20trabajo.`}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-full ${!tempPhoneNumber && !editedAnalysis.telefono ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                aria-disabled={!tempPhoneNumber && !editedAnalysis.telefono}
                onClick={(e) => {
                  if (!tempPhoneNumber && !editedAnalysis.telefono) {
                    e.preventDefault();
                  }
                }}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="sr-only">Enviar mensaje de WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Habilidades */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-[#000000]">Habilidades</h3>
            {!readOnly && (
              <Button
                onClick={addSkill}
                variant="outline"
                size="sm"
                className="linkedin-button-outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Añadir Habilidad
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {editedAnalysis.habilidades && editedAnalysis.habilidades.length > 0 ? (
              editedAnalysis.habilidades.map((skill, index) => (
                <div key={index} className="skill-tag group flex items-center">
                  {readOnly ? (
                    <span className="text-[#0a66c2] text-sm">{skill}</span>
                  ) : (
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      className="bg-transparent text-[#0a66c2] focus:outline-none text-sm w-auto"
                    />
                  )}
                  {!readOnly && (
                    <button
                      onClick={() => removeSkill(index)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-[#0a66c2]" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              readOnly && <p className="text-gray-600">No hay habilidades registradas.</p>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#000000] mb-2">Resumen</h3>
          {readOnly ? (
            <p className="text-base text-gray-800 whitespace-pre-wrap">{editedAnalysis.resumen || 'N/A'}</p>
          ) : (
            <textarea
              value={editedAnalysis.resumen}
              onChange={(e) => handleInputChange('resumen', e.target.value)}
              className="w-full h-32 input-field"
              placeholder="Resumen profesional..."
            />
          )}
        </div>

        {/* Experiencia */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#000000] mb-2">Experiencia</h3>
          {readOnly ? (
            <p className="text-base text-gray-800 whitespace-pre-wrap">{editedAnalysis.experiencia || 'N/A'}</p>
          ) : (
            <textarea
              value={editedAnalysis.experiencia}
              onChange={(e) => handleInputChange('experiencia', e.target.value)}
              className="w-full h-48 input-field"
              placeholder="Experiencia profesional detallada..."
            />
          )}
        </div>

        {/* Botón Guardar */}
        {!readOnly && (
          <div className="flex justify-end">
            <Button
              onClick={() => onSave(editedAnalysis)}
              className="linkedin-button"
              disabled={isSaving} // Deshabilitar el botón si isSaving es true
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Cambios"} {/* Cambiar texto del botón */}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default EditableCV;
