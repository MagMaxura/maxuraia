import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { supabase } from '@/lib/supabase.js'; // Asumiendo que tienes supabase configurado así
import { useAuth } from '@/contexts/AuthContext.jsx'; // Para obtener recruiter_id

function CreateJobForm({ initialData, onPublish, isProcessingJob }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '', // Se espera JSON como string aquí
    keywords: '', // Se espera string separado por comas
    status: 'draft', // 'draft', 'published', 'archived', etc.
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        // Convertir el objeto de requisitos a string JSON para el textarea
        requirements: initialData.requirements ? JSON.stringify(initialData.requirements, null, 2) : '',
        // Convertir el array de keywords a string separado por comas
        keywords: Array.isArray(initialData.keywords) ? initialData.keywords.join(', ') : (initialData.keywords || ''),
        status: initialData.status || 'draft',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      toast({ title: "Error", description: "Debes estar autenticado para publicar un puesto.", variant: "destructive" });
      return;
    }
    if (!formData.title || !formData.description) {
        toast({ title: "Campos requeridos", description: "Título y descripción son obligatorios.", variant: "destructive"});
        return;
    }

    let requirementsObject;
    try {
        requirementsObject = formData.requirements ? JSON.parse(formData.requirements) : {};
    } catch (error) {
        toast({ title: "Error en Requisitos", description: "El formato JSON de los requisitos no es válido.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);

    const jobPayload = {
      recruiter_id: user.id,
      title: formData.title,
      description: formData.description,
      requirements: requirementsObject, // Guardar como objeto JSON
      keywords: formData.keywords.split(',').map(kw => kw.trim()).filter(Boolean), // Guardar como array de strings
      status: 'published', // Al publicar, el estado es 'published'
      // created_at se asigna automáticamente por Supabase
    };

    console.log("Publicando puesto:", jobPayload);

    try {
      // Lógica para llamar a la función de servicio que inserta en la tabla 'jobs'
      // Ejemplo: await jobService.createJob(jobPayload);
      // Por ahora, simularemos la llamada y usaremos onPublish si se proporciona
      if (onPublish) {
        await onPublish(jobPayload); // onPublish debería ser una función async que maneja la inserción
      } else {
        // Si no hay onPublish, se podría intentar una inserción directa aquí (menos modular)
        const { data, error } = await supabase.from('jobs').insert([jobPayload]).select();
        if (error) throw error;
        console.log("Puesto publicado directamente:", data);
        toast({ title: "Publicado", description: "El puesto de trabajo ha sido publicado." });
      }
      // Resetear formulario o redirigir
      setFormData({ title: '', description: '', requirements: '', keywords: '', status: 'draft' });
    } catch (error) {
      console.error("Error al publicar el puesto:", error);
      toast({ title: "Error", description: `No se pudo publicar el puesto: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6 bg-white rounded-xl shadow-xl border">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título del Puesto *</label>
        <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Ej: Desarrollador Frontend React" required disabled={isProcessingJob || isSubmitting} />
        <p className="text-xs text-gray-500 mt-1">Un título claro y atractivo para la vacante.</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción Completa *</label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe las responsabilidades, el equipo, la cultura de la empresa, etc." rows={6} required disabled={isProcessingJob || isSubmitting} />
        <p className="text-xs text-gray-500 mt-1">Detalla todo lo que el candidato necesita saber sobre el rol.</p>
      </div>

      <div>
        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">Requisitos (JSON)</label>
        <Textarea id="requirements" name="requirements" value={formData.requirements} onChange={handleChange} placeholder='Ej: {"Educación": ["Grado en CS"], "Experiencia": ["3+ años en React"]}' rows={4} disabled={isProcessingJob || isSubmitting} />
        <p className="text-xs text-gray-500 mt-1">Estructura los requisitos en formato JSON. Ej: {`{"Educación": ["Grado..."], "Habilidades": ["React", "Node.js"]}`}</p>
      </div>

      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">Palabras Clave</label>
        <Input id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} placeholder="Ej: React, JavaScript, Frontend, Remoto" disabled={isProcessingJob || isSubmitting} />
        <p className="text-xs text-gray-500 mt-1">Palabras clave separadas por coma para facilitar la búsqueda.</p>
      </div>
      
      {/* El campo Status podría ser un select si hay más opciones, o simplemente no mostrarse si siempre es 'published' al crear */}
      {/* <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" disabled={isProcessingJob || isSubmitting}>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
        </select>
      </div> */}

      <div className="flex justify-end">
        <Button type="submit" disabled={isProcessingJob || isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting || isProcessingJob ? "Procesando..." : "Publicar Puesto"}
        </Button>
      </div>
    </form>
  );
}

export default CreateJobForm;