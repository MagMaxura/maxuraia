import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Save, Plus, X } from "lucide-react";

function EditableCV({ analysis, onSave }) {
  const [editedAnalysis, setEditedAnalysis] = useState(analysis);

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
        <h2 className="text-xl font-semibold text-[#000000] mb-6">Editar CV</h2>
        
        {/* Información Personal */}
        <div className="bg-[#f3f2ef] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-[#000000] mb-4">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Nombre</label>
              <input
                type="text"
                value={editedAnalysis.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Edad</label>
              <input
                type="text"
                value={editedAnalysis.edad}
                onChange={(e) => handleInputChange('edad', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Localidad</label>
              <input
                type="text"
                value={editedAnalysis.localidad}
                onChange={(e) => handleInputChange('localidad', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Email</label>
              <input
                type="email"
                value={editedAnalysis.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">Teléfono</label>
              <input
                type="text"
                value={editedAnalysis.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Habilidades */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-[#000000]">Habilidades</h3>
            <Button
              onClick={addSkill}
              variant="outline"
              size="sm"
              className="linkedin-button-outline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Añadir Habilidad
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {editedAnalysis.habilidades.map((skill, index) => (
              <div key={index} className="skill-tag group flex items-center">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => handleSkillChange(index, e.target.value)}
                  className="bg-transparent text-[#0a66c2] focus:outline-none text-sm w-auto"
                />
                <button
                  onClick={() => removeSkill(index)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-[#0a66c2]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#000000] mb-2">Resumen</h3>
          <textarea
            value={editedAnalysis.resumen}
            onChange={(e) => handleInputChange('resumen', e.target.value)}
            className="w-full h-32 input-field"
            placeholder="Resumen profesional..."
          />
        </div>

        {/* Experiencia */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#000000] mb-2">Experiencia</h3>
          <textarea
            value={editedAnalysis.experiencia}
            onChange={(e) => handleInputChange('experiencia', e.target.value)}
            className="w-full h-48 input-field"
            placeholder="Experiencia profesional detallada..."
          />
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <Button
            onClick={() => onSave(editedAnalysis)}
            className="linkedin-button"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default EditableCV;
