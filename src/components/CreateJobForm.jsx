import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { supabase } from '@/lib/supabase.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { PlusCircle, XCircle } from 'lucide-react';

function CreateJobForm({ initialData, onPublish, isProcessingJob, disabled }) { // Añadir prop disabled
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    status: 'draft',
  });
  const [requirementsList, setRequirementsList] = useState([{ category: '', items: [''] }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        keywords: Array.isArray(initialData.keywords) ? initialData.keywords.join(', ') : (initialData.keywords || ''),
        status: initialData.status || 'draft',
      });
      if (initialData.requirements && typeof initialData.requirements === 'object' && Object.keys(initialData.requirements).length > 0) {
        const initialReqsList = Object.entries(initialData.requirements).map(([category, items]) => ({
          category,
          items: Array.isArray(items) ? items.filter(item => typeof item === 'string') : [''],
        }));
        setRequirementsList(initialReqsList.length > 0 ? initialReqsList : [{ category: '', items: [''] }]);
      } else {
        setRequirementsList([{ category: '', items: [''] }]);
      }
    } else {
      setFormData({ title: '', description: '', keywords: '', status: 'draft' });
      setRequirementsList([{ category: '', items: [''] }]);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Funciones para manejar Requisitos Dinámicos ---
  const handleAddRequirementCategory = () => {
    setRequirementsList([...requirementsList, { category: '', items: [''] }]);
  };

  const handleRemoveRequirementCategory = (catIndex) => {
    setRequirementsList(requirementsList.filter((_, index) => index !== catIndex));
  };

  const handleRequirementCategoryChange = (catIndex, value) => {
    const newList = [...requirementsList];
    newList[catIndex].category = value;
    setRequirementsList(newList);
  };

  const handleAddRequirementItem = (catIndex) => {
    const newList = [...requirementsList];
    newList[catIndex].items.push('');
    setRequirementsList(newList);
  };

  const handleRemoveRequirementItem = (catIndex, itemIndex) => {
    const newList = [...requirementsList];
    newList[catIndex].items = newList[catIndex].items.filter((_, index) => index !== itemIndex);
    // Si se eliminan todos los items, dejar uno vacío para la UI o eliminar la categoría si se prefiere
    if (newList[catIndex].items.length === 0) {
      newList[catIndex].items.push(''); 
    }
    setRequirementsList(newList);
  };

  const handleRequirementItemChange = (catIndex, itemIndex, value) => {
    const newList = [...requirementsList];
    newList[catIndex].items[itemIndex] = value;
    setRequirementsList(newList);
  };
  // --- Fin Funciones para Requisitos ---

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

    const requirementsObject = requirementsList.reduce((acc, reqCategory) => {
      const trimmedCategory = reqCategory.category.trim();
      const validItems = reqCategory.items.map(item => item.trim()).filter(Boolean);
      if (trimmedCategory && validItems.length > 0) {
        acc[trimmedCategory] = validItems;
      }
      return acc;
    }, {});
    
    // Validar que si hay categorías o items, el requirementsObject no esté vacío.
    const hasSomeInputInRequirements = requirementsList.some(
      r => r.category.trim() !== '' || r.items.some(i => i.trim() !== '')
    );
    if (hasSomeInputInRequirements && Object.keys(requirementsObject).length === 0) {
        toast({ title: "Error en Requisitos", description: "Asegúrate de que cada categoría de requisito tenga un nombre y al menos un ítem válido.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    const jobPayload = {
      recruiter_id: user.id,
      title: formData.title,
      description: formData.description,
      requirements: requirementsObject,
      keywords: formData.keywords.split(',').map(kw => kw.trim()).filter(Boolean),
      status: 'published',
    };

    console.log("Publicando puesto:", jobPayload);
    try {
      if (onPublish) {
        await onPublish(jobPayload);
      } else {
        const { data, error } = await supabase.from('jobs').insert([jobPayload]).select();
        if (error) throw error;
        console.log("Puesto publicado directamente:", data);
        toast({ title: "Publicado", description: "El puesto de trabajo ha sido publicado." });
      }
      setFormData({ title: '', description: '', keywords: '', status: 'draft' });
      setRequirementsList([{ category: '', items: [''] }]);
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
        <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Ej: Desarrollador Frontend React" required disabled={disabled || isProcessingJob || isSubmitting} />
        <p className="text-xs text-gray-500 mt-1">Un título claro y atractivo para la vacante.</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción Completa *</label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe las responsabilidades, el equipo, la cultura de la empresa, etc." rows={6} required disabled={disabled || isProcessingJob || isSubmitting} />
        <p className="text-xs text-gray-500 mt-1">Detalla todo lo que el candidato necesita saber sobre el rol.</p>
      </div>

      {/* Sección de Requisitos Dinámicos */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Requisitos</label>
        {requirementsList.map((reqCategory, catIndex) => (
          <div key={catIndex} className="p-4 border rounded-md space-y-3 bg-slate-50">
            <div className="flex items-center space-x-2">
              <Input
                value={reqCategory.category}
                onChange={(e) => handleRequirementCategoryChange(catIndex, e.target.value)}
                placeholder="Nombre de la Categoría (Ej: Educación, Experiencia)"
                className="flex-grow"
                disabled={disabled || isProcessingJob || isSubmitting}
              />
              {requirementsList.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRequirementCategory(catIndex)} disabled={disabled || isProcessingJob || isSubmitting} className="text-red-500 hover:text-red-700">
                  <XCircle className="h-5 w-5" />
                </Button>
              )}
            </div>
            {reqCategory.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center space-x-2 ml-4">
                <Input
                  value={item}
                  onChange={(e) => handleRequirementItemChange(catIndex, itemIndex, e.target.value)}
                  placeholder="Detalle del requisito"
                  className="flex-grow"
                  disabled={disabled || isProcessingJob || isSubmitting}
                />
                {reqCategory.items.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRequirementItem(catIndex, itemIndex)} disabled={disabled || isProcessingJob || isSubmitting} className="text-red-500 hover:text-red-700">
                    <XCircle className="h-4 w-4" />
                  </Button>
                ) : <div className="w-9 h-9"></div> /* Placeholder for alignment */}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddRequirementItem(catIndex)} disabled={disabled || isProcessingJob || isSubmitting} className="text-blue-600 border-blue-600 hover:bg-blue-50">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ítem a Categoría
            </Button>
          </div>
        ))}
        <Button type="button" onClick={handleAddRequirementCategory} disabled={disabled || isProcessingJob || isSubmitting} className="mt-2">
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Categoría de Requisito
        </Button>
        <p className="text-xs text-gray-500 mt-1">Define categorías (ej: Educación, Experiencia) y los ítems específicos para cada una.</p>
      </div>


      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">Palabras Clave</label>
        <Input id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} placeholder="Ej: React, JavaScript, Frontend, Remoto" disabled={disabled || isProcessingJob || isSubmitting} />
        <p className="text-xs text-gray-500 mt-1">Palabras clave separadas por coma para facilitar la búsqueda.</p>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isProcessingJob || isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting || isProcessingJob ? "Procesando..." : "Publicar Puesto"}
        </Button>
      </div>
    </form>
  );
}

export default CreateJobForm;