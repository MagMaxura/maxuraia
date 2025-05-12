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
  business: 25,
  enterprise: Infinity,
  // Asegúrate de que estos plan_id coincidan con los de tu tabla 'suscripciones'
  // y la CHECK constraint. Si usaste "Profesional" en la BD para el básico, ajústalo aquí.
};

function CreateNewJobTab({ setActiveTab, currentJobsCount, onJobPublished }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessingJob, setIsProcessingJob] = useState(false);
  const [jobPostData, setJobPostData] = useState(null); // Para datos generados por IA o para edición

  const handlePublishJob = async (jobPayload) => {
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

    if (currentJobsCount >= jobLimit) {
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
      const payloadWithRecruiter = { ...jobPayload, recruiter_id: user.id };
      const newJob = await cvService.createJobPost(payloadWithRecruiter);
      console.log("Puesto publicado desde CreateNewJobTab:", newJob);
      
      toast({ title: "¡Puesto Publicado!", description: `${newJob.title} ha sido publicado.` });
      setJobPostData(null);
      
      if (onJobPublished) {
        onJobPublished(newJob); // Notificar al Dashboard para actualizar la lista de jobs
      }

      if (setActiveTab) {
        setActiveTab("puestosPublicados");
      }
    } catch (error) {
      console.error("Error al publicar puesto desde CreateNewJobTab:", error);
      toast({ title: "Error al Publicar", description: `No se pudo publicar el puesto: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessingJob(false);
    }
  };

  const planId = user?.suscripcion?.plan_id || 'basico';
  const status = user?.suscripcion?.status;
  const jobLimit = PLAN_JOB_LIMITS[planId] || 0;
  const canCreateJob = (status === 'active' || status === 'trialing') && currentJobsCount < jobLimit;
  const limitReached = (status === 'active' || status === 'trialing') && currentJobsCount >= jobLimit;

  return (
    <div className="space-y-8">
      {limitReached && (
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
       {! (status === 'active' || status === 'trialing') && user?.suscripcion && (
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


      <CreateJobAIForm
        onJobGenerated={(generatedData) => {
          console.log("CreateNewJobTab: Job data generated by AI:", generatedData);
          setJobPostData(generatedData);
          toast({ title: "Sugerencia de IA generada", description: "Puedes editar los detalles antes de publicar." });
        }}
        setIsLoadingParent={setIsProcessingJob}
        disabled={!canCreateJob || isProcessingJob} // Deshabilitar si no puede crear
      />
      <CreateJobForm
        initialData={jobPostData}
        key={jobPostData ? JSON.stringify(jobPostData) : 'empty-form'}
        onPublish={handlePublishJob}
        isProcessingJob={isProcessingJob}
        disabled={!canCreateJob || isProcessingJob} // Deshabilitar si no puede crear
      />
    </div>
  );
}

export default CreateNewJobTab;