import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { cvService } from '@/services/cvService';
import { Brain, AlertCircle, ArrowRightCircle } from 'lucide-react'; // Importar los iconos necesarios
import CreateJobAIForm from '../CreateJobAIForm.jsx'; // Importar el componente del formulario AI (ruta corregida)
import { APP_PLANS } from '@/config/plans'; // Importar APP_PLANS
import { useDashboardData } from '@/hooks/useDashboardData'; // Importar useDashboardData

function CreateNewJobTab({ currentJobsCount, onJobPublishedOrUpdated, editingJob, setEditingJob, effectiveLimits, isBonusPlanActive, bonusJobUsed, bonusJobTotal }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isBasePlanActive, basePlan } = useDashboardData(); // Obtener directamente del hook
  console.log("CreateNewJobTab: effectiveLimits recibidos:", effectiveLimits); // Nuevo log para depuración
  const [jobDetails, setJobDetails] = useState({
    title: '',
    description: '',
    ai_generated_description: '', // Campo para la descripción generada por IA
  });
  const [isProcessingJob, setIsProcessingJob] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Estado para saber si estamos editando

  useEffect(() => {
    console.log("CreateNewJobTab useEffect: editingJob changed", editingJob);
    if (editingJob) {
      setJobDetails({
        title: editingJob.title || '',
        description: editingJob.description || '',
        requirements: editingJob.requirements || {}, // Cargar requisitos, asegurar objeto vacío si es nulo
        keywords: editingJob.keywords || [], // Cargar palabras clave, asegurar array vacío si es nulo
      });
      setIsEditing(true);
    } else {
      // Resetear el formulario si no estamos editando
      setJobDetails({
        title: '',
        description: '',
        requirements: {}, // Resetear requisitos a objeto vacío
        keywords: [], // Resetear palabras clave a array vacío
      });
      setIsEditing(false);
    }
  }, [editingJob]); // Dependencia: editingJob

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleSaveJob = async () => {
    console.log("CreateNewJobTab: handleSaveJob called");
    console.log("CreateNewJobTab: jobDetails al inicio:", JSON.stringify(jobDetails, null, 2)); // Log detallado del estado
    console.log("CreateNewJobTab: user.id:", user?.id);

    if (!user?.id) {
      console.log("CreateNewJobTab: Validación fallida - Usuario no autenticado.");
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }

    if (!jobDetails.title || (!jobDetails.description && !jobDetails.ai_generated_description)) {
      console.log("CreateNewJobTab: Validación fallida - Título o descripción faltante.");
      toast({ title: "Error", description: "El título y la descripción (o descripción IA) del puesto son obligatorios.", variant: "destructive" });
      return;
    }

    setIsProcessingJob(true);
    try {
      const planId = user.suscripcion?.plan_id || 'basico'; // Fallback a 'basico' si no hay suscripción
      const status = user.suscripcion?.status;
      // Obtener jobLimit de effectiveLimits
      const jobLimit = effectiveLimits?.jobLimit || 0; // Usar jobLimit directamente

      // Verificar estado de suscripción si no estamos editando
      if (!isEditing && (status !== 'active' && status !== 'trialing')) {
        console.log("CreateNewJobTab: Validación fallida - Suscripción no activa o en prueba.");
        toast({
          title: "Suscripción no activa",
          description: "Tu suscripción no está activa. Por favor, revisa tu plan.",
          variant: "destructive",
        });
        setIsProcessingJob(false);
        return;
      }

      // La verificación de límite solo aplica si NO estamos editando.
      // Si estamos editando, permitimos la actualización sin contar contra el límite de *nuevos* puestos.
      if (!isEditing && currentJobsCount >= jobLimit) {
        console.log(`CreateNewJobTab: Validación fallida - Límite de puestos alcanzado (${currentJobsCount}/${jobLimit}).`);
        toast({
          title: "Límite de Puestos Alcanzado",
          description: `Has alcanzado el límite de ${jobLimit === Infinity ? 'puestos ilimitados' : `${jobLimit} puestos activos`} para tu plan "${effectiveLimits?.effectiveCurrentPlan?.name || planId}". Considera actualizar tu plan para crear más.`,
          variant: "destructive",
          duration: 7000,
        });
        setIsProcessingJob(false);
        return;
      }

      const jobDataToSave = {
        recruiter_id: user.id,
        title: jobDetails.title,
        description: jobDetails.description, // Usar el campo description (que ahora puede contener la IA)
        requirements: jobDetails.requirements, // Incluir requisitos
        keywords: jobDetails.keywords, // Incluir palabras clave
      };

      console.log("CreateNewJobTab: jobDataToSave:", jobDataToSave); // Nuevo log

      let savedJob;
      if (isEditing && editingJob?.id) {
        console.log("CreateNewJobTab: Updating job with ID:", editingJob.id);
        savedJob = await cvService.updateJobPost(editingJob.id, jobDataToSave);
        console.log("CreateNewJobTab: updateJobPost result:", savedJob); // Nuevo log
        toast({ title: "Puesto Actualizado", description: "El puesto de trabajo ha sido actualizado." });
      } else {
        console.log("CreateNewJobTab: Calling cvService.createJobPost with data:", jobDataToSave); // Log antes de la llamada
        savedJob = await cvService.createJobPost(jobDataToSave);
        console.log("CreateNewJobTab: cvService.createJobPost returned:", savedJob); // Log después de la llamada exitosa
        toast({ title: "Puesto Publicado", description: "Se ha creado un nuevo puesto de trabajo." });
      }

      // Llamar a la función para actualizar la lista en el Dashboard
      if (onJobPublishedOrUpdated) {
        onJobPublishedOrUpdated(savedJob);
      }

      // Limpiar el formulario y estado de edición después de guardar/actualizar
      setJobDetails({ title: '', description: '', ai_generated_description: '' });
      setEditingJob(null); // Limpiar el job en edición en el Dashboard
      setIsEditing(false); // Asegurarse de que el estado local también se resetee

      // Opcional: Cambiar a la pestaña de puestos publicados

    } catch (error) {
      console.error('CreateNewJobTab: Error al guardar/actualizar el puesto:', error);
      console.trace('CreateNewJobTab: Stack trace for error:'); // Añadir stack trace
      toast({
        title: "Error al guardar puesto",
        description: `No se pudo guardar el puesto: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingJob(false);
    }
  };

  // Determinar si se puede crear un nuevo puesto (solo si NO estamos editando)
  const planId = user?.suscripcion?.plan_id || 'basico';
  const status = user?.suscripcion?.status;
  // Obtener jobLimit de effectiveLimits
  const jobLimit = effectiveLimits.jobLimit; // Usar consistentemente jobLimit (ya que effectiveLimits ya es el objeto)
  // canCreateJob ahora solo se aplica si NO estamos editando. Si estamos editando, siempre se puede intentar guardar.
  const canCreateNewJob = !isEditing && (status === 'active' || status === 'trialing') && currentJobsCount < jobLimit;
  const limitReachedForNew = !isEditing && (status === 'active' || status === 'trialing') && currentJobsCount >= jobLimit;
  const formDisabledOverall = isEditing ? isProcessingJob : (!canCreateNewJob || isProcessingJob);


  console.log("CreateNewJobTab Debug - currentJobsCount:", currentJobsCount);
  console.log("CreateNewJobTab Debug - jobLimit:", jobLimit);
  console.log("CreateNewJobTab Debug - status:", status);
  console.log("CreateNewJobTab Debug - isEditing:", isEditing);
  console.log("CreateNewJobTab Debug - canCreateNewJob:", canCreateNewJob);
  console.log("CreateNewJobTab Debug - formDisabledOverall:", formDisabledOverall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl space-y-6"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">{isEditing ? 'Editar Puesto de Trabajo' : 'Crear Nuevo Puesto de Trabajo'}</h2>

      {/* Mensaje de Plan Mensual Vencido */}
      {!isBasePlanActive && basePlan && (basePlan.type === 'monthly' || basePlan.type === 'enterprise') && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Tu plan mensual <strong className="font-semibold capitalize">{basePlan.name}</strong> ha expirado. Aunque tengas bonos puntuales activos, te recomendamos <a href="/#pricing" className="underline hover:text-red-600 font-semibold">renovar tu suscripción</a> para mantener todas las funcionalidades.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información de Uso y Límite del Plan Actual */}
      {effectiveLimits.isSubscriptionActive && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-semibold mb-2">Tu Plan Actual: <span className="capitalize">{effectiveLimits?.effectiveCurrentPlan?.name || APP_PLANS[effectiveLimits?.effectiveCurrentPlan?.id || 'basico']?.name || 'Básico'}</span></p>
          <p>
            Puestos de trabajo creados: <strong className="font-semibold">{effectiveLimits.jobs_used}</strong> de <strong className="font-semibold">{effectiveLimits.jobLimit === Infinity ? 'Ilimitados' : effectiveLimits.jobLimit}</strong>
          </p>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${effectiveLimits.jobLimit === Infinity || effectiveLimits.jobLimit === 0 ? 100 : (effectiveLimits.jobs_used / effectiveLimits.jobLimit) * 100}%` }}
            ></div>
          </div>
          {effectiveLimits.jobLimit !== Infinity && effectiveLimits.jobs_used >= effectiveLimits.jobLimit && (
            <a href="/#pricing" className="mt-3 inline-block">
              <Button variant="outline" size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500">
                Actualizar Plan
                <ArrowRightCircle className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Mensaje de Límite Alcanzado (solo si NO estamos editando) */}
      {limitReachedForNew && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Has alcanzado el límite de <strong className="font-semibold">{effectiveLimits.jobLimit === Infinity ? 'puestos ilimitados' : `${effectiveLimits.jobLimit} puestos activos`}</strong> para tu plan <strong className="font-semibold capitalize">{effectiveLimits?.effectiveCurrentPlan?.name || planId}</strong>.
                Para crear más puestos, por favor considera <a href="/#pricing" className="underline hover:text-yellow-600">actualizar tu plan</a>.
              </p>
            </div>
          </div>
        </div>
      )}

       {/* Mensaje de Suscripción no activa (solo si NO estamos editando) */}
       {!isEditing && !(status === 'active' || status === 'trialing') && user?.suscripcion && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow">
           <div className="flex">
             <div className="flex-shrink-0">
               <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
             </div>
             <div className="ml-3">
               <p className="text-sm text-red-700">
                 Tu suscripción actual (<strong className="font-semibold capitalize">{status}</strong>) no te permite crear nuevos puestos.
                 Por favor, <a href="/#pricing" className="underline hover:text-red-600">revisa tu plan</a> o contacta a soporte.
               </p>
             </div>
           </div>
         </div>
        )}


      {/* Formulario de Puesto de Trabajo */}
      <div className={`space-y-6 ${formDisabledOverall ? 'opacity-50 pointer-events-none' : ''}`}> {/* Aumentado el espacio */}

        {/* Asistente IA para Creación de Puestos */}
        <CreateJobAIForm
          onJobGenerated={(generatedJobData) => {
            setJobDetails(prevDetails => ({
              ...prevDetails,
              title: generatedJobData.title || prevDetails.title,
              description: generatedJobData.description || prevDetails.description, // Asignar a description
              requirements: generatedJobData.requirements || prevDetails.requirements, // Asignar a requirements
              keywords: generatedJobData.keywords || prevDetails.keywords, // Asignar a keywords
            }));
          }}
          currentDescription={jobDetails.description}
          disabled={formDisabledOverall}
        />

        {/* Sección de Creación Manual */}
        <div className="space-y-4 border-t pt-6 mt-6"> {/* Separador visual */}
          <h3 className="text-xl font-semibold text-slate-800">Detalles del Puesto (Manual o Editar IA)</h3>

          {/* Campo Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Título del Puesto</label>
            <Input
              type="text"
              id="title"
              name="title"
              value={jobDetails.title}
              onChange={handleInputChange}
              placeholder="Ej: Desarrollador Frontend Senior"
              disabled={formDisabledOverall}
            />
          </div>

          {/* Campo Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descripción del Puesto</label>
            <Textarea
              id="description"
              name="description"
              value={jobDetails.description}
              onChange={handleInputChange}
              placeholder="Describe detalladamente el puesto, responsabilidades, requisitos, etc."
              rows="6"
              disabled={formDisabledOverall}
            />
            <p className="mt-1 text-sm text-slate-500">
              Puedes editar la descripción generada por IA o escribir una manualmente.
            </p>
          </div>

          {/* Campo Requisitos (Interfaz mejorada) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Requisitos</label>
            <div className="space-y-3">
              {jobDetails.requirements && Object.entries(jobDetails.requirements).map(([category, items]) => (
                Array.isArray(items) && items.map((item, index) => (
                  // Usar una clave estable combinando category y index
                  <div key={`${category}-${index}`} className="flex space-x-2 items-center">
                    <Input
                      type="text"
                      value={category}
                      onChange={(e) => handleRequirementChange(category, index, e.target.value, item)}
                      placeholder="Categoría (Ej: Educación)"
                      className="w-1/3"
                      disabled={formDisabledOverall}
                    />
                    <Input
                      type="text"
                      value={item}
                      onChange={(e) => handleRequirementChange(category, index, category, e.target.value)}
                      placeholder="Cualidad (Ej: Secundaria Completa)"
                      className="w-2/3"
                      disabled={formDisabledOverall}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveRequirement(category, index)}
                      disabled={formDisabledOverall}
                    >
                      -
                    </Button>
                  </div>
                ))
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddNewRequirement}
                disabled={formDisabledOverall}
              >
                + Añadir Requisito
              </Button>
            </div>
            <p className="mt-1 text-sm text-slate-500">Añade o edita los requisitos del puesto.</p>
          </div>

          {/* Campo Palabras Clave */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-slate-700 mb-1">Palabras Clave (Separadas por coma)</label>
            <Input
              id="keywords"
              name="keywords"
              value={Array.isArray(jobDetails.keywords) ? jobDetails.keywords.join(', ') : ''}
              onChange={(e) => {
                const keywordsArray = e.target.value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword !== '');
                setJobDetails(prevDetails => ({
                  ...prevDetails,
                  keywords: keywordsArray,
                }));
              }}
              placeholder="Ej: React, TypeScript, UI/UX, Fintech"
              disabled={formDisabledOverall}
            />
            <p className="mt-1 text-sm text-slate-500">Ingresa las palabras clave separadas por comas.</p>
          </div>

        </div> {/* Fin Sección Creación Manual */}


        {/* Botón de Guardar */}
        <Button
          onClick={handleSaveJob}
          disabled={formDisabledOverall}
          className="w-full"
        >
          {isProcessingJob ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Puesto' : 'Publicar Puesto')}
        </Button>
      </div>
    </motion.div>
  );

  // Helper functions for Requirements
  function handleRequirementChange(category, index, newCategory, newItem) {
    setJobDetails(prevDetails => {
      const updatedRequirements = { ...prevDetails.requirements };

      if (newCategory !== category) {
        // Si la categoría cambió, necesitamos mover el item a la nueva categoría
        const oldItems = updatedRequirements[category];
        if (oldItems && Array.isArray(oldItems)) {
          // Crear nuevo array para la categoría antigua excluyendo el item
          const newOldItems = oldItems.filter((_, i) => i !== index);
          if (newOldItems.length === 0) {
            delete updatedRequirements[category];
          } else {
            updatedRequirements[category] = newOldItems;
          }
        }

        // Añadir a la nueva categoría (creando un nuevo array si es necesario)
        if (!updatedRequirements[newCategory]) {
          updatedRequirements[newCategory] = [];
        }
        updatedRequirements[newCategory] = [...updatedRequirements[newCategory], newItem];

      } else {
        // Si solo cambió el item dentro de la misma categoría
        const items = updatedRequirements[category];
        if (items && Array.isArray(items)) {
          // Crear una nueva instancia de array para la categoría modificada
          updatedRequirements[category] = items.map((item, i) =>
            i === index ? newItem : item
          );
        }
      }
      return { ...prevDetails, requirements: updatedRequirements };
    });
  }

  function handleRemoveRequirement(category, index) {
    setJobDetails(prevDetails => {
      const updatedRequirements = { ...prevDetails.requirements };
      const items = updatedRequirements[category];

      if (items && Array.isArray(items)) {
        // Crear una nueva instancia de array excluyendo el item a remover
        const newItems = items.filter((_, i) => i !== index);
        if (newItems.length === 0) {
          delete updatedRequirements[category];
        } else {
          updatedRequirements[category] = newItems;
        }
      }
      return { ...prevDetails, requirements: updatedRequirements };
    });
  }

  function handleAddNewRequirement() {
    setJobDetails(prevDetails => {
      const currentRequirements = prevDetails.requirements || {};
      const updatedRequirements = {};

      // Copiar todas las categorías y sus ítems de forma inmutable
      for (const cat in currentRequirements) {
        if (Object.hasOwnProperty.call(currentRequirements, cat)) {
          updatedRequirements[cat] = [...currentRequirements[cat]]; // Copiar el array de ítems
        }
      }

      const defaultCategory = 'Nueva Categoría';
      const defaultItem = 'Nuevo Requisito';

      if (!updatedRequirements[defaultCategory]) {
        updatedRequirements[defaultCategory] = [];
      }
      updatedRequirements[defaultCategory].push(defaultItem);

      return { ...prevDetails, requirements: updatedRequirements };
    });
  }
}

export default CreateNewJobTab;