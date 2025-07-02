
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Briefcase as BriefcaseIcon, Save } from 'lucide-react';
import { cvService } from "../services/cvService"; // Importar cvService
import { useAuth } from "../contexts/AuthContext"; // Importar useAuth

function CreateJob() {
  const { toast } = useToast();
  const { user } = useAuth(); // Obtener el usuario del contexto de autenticación
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    keywords: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user?.id) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para crear un puesto de trabajo.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const jobData = {
        recruiter_id: user.id,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(req => req.trim() !== ''), // Convertir a array
        keywords: formData.keywords.split(',').map(kw => kw.trim()).filter(kw => kw !== ''), // Convertir a array
        status: 'active' // O el estado inicial que desees
      };

      await cvService.createJobPost(jobData);

      toast({
        title: "Puesto creado",
        description: "El puesto de trabajo se ha publicado correctamente en Supabase.",
      });

      setFormData({
        title: "",
        description: "",
        requirements: "",
        keywords: ""
      });
    } catch (error) {
      console.error("Error al crear el puesto de trabajo:", error);
      toast({
        title: "Error",
        description: `No se pudo crear el puesto de trabajo: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <BriefcaseIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Puesto de Trabajo</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del puesto
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ej. Desarrollador Full Stack Senior"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del puesto
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
              placeholder="Describe las responsabilidades y el día a día del puesto..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requisitos
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
              placeholder="Lista los requisitos necesarios para el puesto..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palabras clave (separadas por comas)
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ej. React, Node.js, AWS, Scrum"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Guardando..." : "Publicar Puesto"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default CreateJob;
