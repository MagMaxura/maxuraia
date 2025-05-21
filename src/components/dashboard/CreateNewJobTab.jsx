import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import CreateJobAIForm from '@/components/CreateJobAIForm.jsx';
import CreateJobForm from '@/components/CreateJobForm.jsx';
import { cvService } from '@/services/cvService.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AlertCircle } from 'lucide-react'; // Para el icono de advertencia

const PLAN_JOB_LIMITS = {
  trial: 1,
  basico: 3, // Anteriormente "Profesional"
  busqueda_puntual: 1,
  business: 25,
  enterprise: Infinity,
  // Asegúrate de que estos plan_id coincidan con los de tu tabla 'suscripciones'
  // y la CHECK constraint. Si usaste "Profesional" en la BD para el básico, ajústalo aquí.
};

function CreateNewJobTab({
  setActiveTab,
  currentJobsCount,
  onJobPublishedOrUpdated, // Renombrar prop para claridad
  editingJobData,      // Datos del job a editar
  clearEditingJob      // Función para limpiar editingJobData en Dashboard
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessingJob, setIsProcessingJob] = useState(false);
  // jobPostData ahora se inicializa con editingJobData si existe
  const [jobPostData, setJobPostData] = useState(editingJobData || null);
  const [isEditing, setIsEditing] = useState(!!editingJobData);

  // Efecto para cargar datos de edición cuando editingJobData cambia y limpiar el estado de edición
  React.useEffect(() => {
    if (editingJobData) {
      setJobPostData(editingJobData);
      setIsEditing(true);
    } else {
      // Si no hay editingJobData (ej. se navega a la pestaña directamente para crear)
      // o si se limpió después de una edición, resetear.
      // setJobPostData(null); // No resetear aquí si queremos que la IA persista hasta publicar
      // setIsEditing(false); // Se maneja al final de handlePublishJob
    }
    // No llamar a clearEditingJob aquí para permitir que el formulario se llene.
    // Se llamará después de que el formulario lo use.
  }, [editingJobData]);
  
  // Efecto para limpiar editingJobData en el Dashboard una vez que se ha usado para inicializar el formulario
  React.useEffect(() => {
    if (editingJobData && clearEditingJob) {
      clearEditingJob();
    }
  }, [editingJobData, clearEditingJob]);


  const handlePublishJob = async (jobPayloadFromForm) => {
    if (!user?.id) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }

    const planId = user.suscripcion?.plan_id || 'basico'; // Fallback a 'basico' si no hay suscripción
    const status = user.suscripcion?.status;
    const jobLimit = PLAN_JOB_LIMITS[planId] || 0; // Límite de puestos para el plan actual

    // Considerar el estado 'trialing' como activo para el límite de prueba
    if (status !== 'active' && status !== 'trialing') {
      toast({
        title: "Suscripción no activa",
        description: "Tu suscripción no está activa. Por favor, revisa tu plan.",
        variant: "destructive",
      });
      return;
    }
    
    // La verificación de límite solo aplica si NO estamos editando.
    // Si estamos editando, permitimos la actualización sin contar contra el límite de *nuevos* puestos.
    if (!isEditing && currentJobsCount >= jobLimit) {
      toast({
        title: "Límite de Puestos Alcanzado",
        description: `Has alcanzado el límite de ${jobLimit} puestos activos para tu plan "${planId}". Considera actualizar tu plan para crear más.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setIsProcessingJob(true);
    try {
      let publishedOrUpdatedJob;
      if (isEditing && jobPostData?.id) { // Si estamos editando y tenemos un ID de job
        console.log("CreateNewJobTab: Actualizando puesto ID:", jobPostData.id);
        // Asegurarse de que recruiter_id no se envíe o sea el correcto si la RLS lo permite
        const payloadToUpdate = { ...jobPayloadFromForm };
        delete payloadToUpdate.recruiter_id; // No se debería cambiar el recruiter_id al editar
        
        publishedOrUpdatedJob = await cvService.updateJobPost(jobPostData.id, payloadToUpdate);
        toast({ title: "¡Puesto Actualizado!", description: `${publishedOrUpdatedJob.title} ha sido actualizado.` });
      } else { // Creando nuevo puesto
        const payloadWithRecruiter = { ...jobPayloadFromForm, recruiter_id: user.id };
        publishedOrUpdatedJob = await cvService.createJobPost(payloadWithRecruiter);
        toast({ title: "¡Puesto Publicado!", description: `${publishedOrUpdatedJob.title} ha sido publicado.` });
      }
      
      console.log(isEditing ? "Puesto actualizado:" : "Puesto publicado:", publishedOrUpdatedJob);
      setJobPostData(null); // Limpiar datos del formulario (o IA)
      setIsEditing(false); // Resetear modo edición
      
      if (onJobPublishedOrUpdated) {
        onJobPublishedOrUpdated(publishedOrUpdatedJob);
      }

      if (setActiveTab) {
        setActiveTab("puestosPublicados");
      }
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'publicar'} puesto desde CreateNewJobTab:`, error);
      toast({ title: `Error al ${isEditing ? 'Actualizar' : 'Publicar'}`, description: `No se pudo ${isEditing ? 'actualizar' : 'publicar'} el puesto: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessingJob(false);
    }
  };

  const planId = user?.suscripcion?.plan_id || 'basico';
  const status = user?.suscripcion?.status;
  const jobLimit = PLAN_JOB_LIMITS[planId] || 0;
  // canCreateJob ahora solo se aplica si NO estamos editando. Si estamos editando, siempre se puede intentar guardar.
  const canCreateNewJob = !isEditing && (status === 'active' || status === 'trialing') && currentJobsCount < jobLimit;
  const limitReachedForNew = !isEditing && (status === 'active' || status === 'trialing') && currentJobsCount >= jobLimit;
  const formDisabledOverall = isEditing ? isProcessingJob : (!canCreateNewJob || isProcessingJob);


  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-slate-800 mb-2">
        {isEditing ? "Modificar Puesto de Trabajo" : "Crear Nuevo Puesto de Trabajo"}
      </h2>

      {limitReachedForNew && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Has alcanzado el límite de <strong className="font-semibold">{jobLimit}</strong> puestos activos para tu plan <strong className="font-semibold capitalize">{planId}</strong>.
                Para crear más puestos, por favor considera <a href="/#pricing" className="underline hover:text-yellow-600">actualizar tu plan</a>.
              </p>
            </div>
          </div>
        </div>
      )}
       {!isEditing && !(status === 'active' || status === 'trialing') && user?.suscripcion && (
         <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow">
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

      {/* El formulario de IA podría no ser ideal para editar, o necesitaría lógica para no sobreescribir.
          Por ahora, lo deshabilitamos si estamos editando, o el usuario puede usarlo para generar una nueva base.
          Si se usa la IA, se sobreescribirá jobPostData, perdiendo los datos de edición.
          Una mejor UX sería deshabilitar la IA o que la IA precargue el prompt con datos existentes.
      */}
      <CreateJobAIForm
        onJobGenerated={(generatedData) => {
          console.log("CreateNewJobTab: Job data generated by AI:", generatedData);
          setJobPostData(generatedData); // Esto sobreescribirá editingJobData si se usa en modo edición
          setIsEditing(false); // Si se usa la IA, ya no estamos editando el job original
          toast({ title: "Sugerencia de IA generada", description: "Puedes editar los detalles antes de publicar." });
        }}
        setIsLoadingParent={setIsProcessingJob}
        disabled={formDisabledOverall || isProcessingJob}
      />
      <CreateJobForm
        initialData={jobPostData} // Esto se llenará con editingJobData al inicio si está en modo edición
        key={jobPostData ? jobPostData.id || JSON.stringify(jobPostData) : 'empty-form'} // Usar ID si existe para la key
        onPublish={handlePublishJob}
        isProcessingJob={isProcessingJob}
        disabled={formDisabledOverall || isProcessingJob}
        isEditing={isEditing} // Pasar isEditing a CreateJobForm para cambiar el texto del botón
      />
    </div>
  );
}

export default CreateNewJobTab;