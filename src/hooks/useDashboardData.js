import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cvService } from '@/services/cvService.js';
import { useToast } from "@/components/ui/use-toast";
import { APP_PLANS, PLAN_CV_ANALYSIS_LIMITS, calculateEffectivePlan } from '@/config/plans'; // Importar planes, límites y la nueva función

export function useDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingCVs, setIsLoadingCVs] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const initialLoadAttemptedForUserIdRef = useRef(null);

  useEffect(() => {
    console.log("[DEBUG] useDashboardData: useEffect triggered. Current user:", user);
    const currentUserId = user?.id;

    const loadUserCandidatosYCVs = async (userIdToLoad) => { // Renombrado
      console.log("useDashboardData: Fetching Candidatos (and their CVs) for recruiterId:", userIdToLoad);
      setIsLoadingCVs(true); // Sigue usando isLoadingCVs para la UI, podría renombrarse luego
      try {
        const fetchedCandidatos = await cvService.getCandidatosConCVsByRecruiterId(userIdToLoad); // Nueva función del servicio
        console.log("useDashboardData: Fetched Candidatos from DB:", fetchedCandidatos);
        
        const formattedData = fetchedCandidatos.map(candidato => {
          // Cada 'candidato' puede tener un array 'cvs'. Tomamos el más reciente o el primero.
          const cvPrincipal = candidato.cvs && candidato.cvs.length > 0
            ? candidato.cvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
            : null;

          let analysisData = cvPrincipal?.analysis_result || {};
          
          // Poblar análisis con datos del candidato si no están en analysis_result
          analysisData.nombre = candidato.name || analysisData.nombre;
          analysisData.email = candidato.email || analysisData.email;
          analysisData.telefono = candidato.phone || analysisData.telefono;
          analysisData.localidad = candidato.location || analysisData.localidad;
          analysisData.nivel_escolarizacion = candidato.title || analysisData.nivel_escolarizacion || analysisData.title; // Asegurar que el título del candidato se use
          analysisData.resumen = candidato.summary || analysisData.summary;
          analysisData.experiencia = candidato.experience || analysisData.experiencia; // Asumiendo que 'experience' es un campo de texto en 'candidatos'
          
          // Habilidades: Tomarlas del candidato si existen, sino del análisis del CV
          if (Array.isArray(candidato.skills) && candidato.skills.length > 0) {
            // Asumir que candidato.skills es un array plano de strings.
            // Si tiene estructura {tecnicas: [], blandas: []} en la BD, ajustar aquí.
             analysisData.habilidades = { tecnicas: candidato.skills, blandas: [] }; // Simplificación, ajustar si es necesario
          } else if (cvPrincipal?.analysis_result?.habilidades) {
            analysisData.habilidades = cvPrincipal.analysis_result.habilidades;
          } else {
            analysisData.habilidades = { tecnicas: [], blandas: [] };
          }

          if (cvPrincipal?.content && (!analysisData.textoCompleto || analysisData.textoCompleto.trim() === '')) {
            analysisData.textoCompleto = cvPrincipal.content;
          }

          return {
            name: candidato.name || (cvPrincipal?.file_name ? `CV de ${candidato.name || 'Candidato'}` : `Candidato ${candidato.id}`),
            originalFile: null, // Esto podría necesitar ajuste si se sube un nuevo CV para un candidato existente
            analysis: analysisData,
            uploadedDate: new Date(cvPrincipal?.created_at || candidato.created_at), // Fecha del CV o del candidato
            cv_database_id: cvPrincipal?.id || candidato.cv_id || null, // Usar candidato.cv_id como fallback
            candidate_database_id: candidato.id,
          };
        });
        setCvFiles(formattedData); // Sigue usando setCvFiles, podría renombrarse a setProcessedData o similar
      } catch (error) {
        console.error("useDashboardData: Error fetching user Candidatos/CVs:", error);
        toast({ title: "Error al cargar Candidatos", description: "No se pudieron cargar tus candidatos guardados.", variant: "destructive" });
        setCvFiles([]);
      } finally {
        setIsLoadingCVs(false);
      }
    };

    const loadUserJobs = async (userIdToLoad) => {
      console.log("useDashboardData: Fetching Jobs for recruiterId:", userIdToLoad);
      setIsLoadingJobs(true);
      try {
        const fetchedJobs = await cvService.getJobsByRecruiterId(userIdToLoad);
        console.log("useDashboardData: Fetched Jobs from DB:", fetchedJobs);
        setJobs(fetchedJobs || []);
      } catch (error) {
        console.error("useDashboardData: Error fetching user Jobs:", error);
        toast({ title: "Error al cargar Puestos", description: "No se pudieron cargar tus puestos de trabajo guardados.", variant: "destructive" });
        setJobs([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    if (!currentUserId) {
      console.log("useDashboardData useEffect: No currentUserId. Clearing data and ref.");
      setCvFiles([]);
      setJobs([]);
      setIsLoadingCVs(false);
      setIsLoadingJobs(false);
      initialLoadAttemptedForUserIdRef.current = null; // Reiniciar ref
      return;
    }

    if (initialLoadAttemptedForUserIdRef.current !== currentUserId) {
      console.log(`useDashboardData useEffect: New or different userId. Attempting initial load for ${currentUserId}.`);
      initialLoadAttemptedForUserIdRef.current = currentUserId;
      loadUserCandidatosYCVs(currentUserId); // Llamar a la función renombrada
      loadUserJobs(currentUserId);
    } else {
      console.log(`useDashboardData useEffect: Initial load already attempted for userId ${currentUserId}. Skipping.`);
      // Si ya se intentó la carga y las listas están vacías, isLoading debería ser false.
      // Esto previene que se muestre "Cargando..." indefinidamente si no hay datos.
      if (cvFiles.length === 0 && isLoadingCVs) setIsLoadingCVs(false);
      if (jobs.length === 0 && isLoadingJobs) setIsLoadingJobs(false);
    }

    // Lógica para reiniciar contadores de planes de pago único
    if (user?.suscripcion && user.suscripcion.plan_id) {
      const subscription = user.suscripcion;
      const planDetails = APP_PLANS[subscription.plan_id];
      const now = new Date();
      const periodEndsAt = subscription.current_period_end ? new Date(subscription.current_period_end) : null;

      // Solo reiniciar si es un plan de pago único y el período ha terminado
      if (planDetails?.type === 'one-time' && periodEndsAt && periodEndsAt < now) {
        console.log(`[DEBUG] useDashboardData: Plan de pago único expirado para suscripción ${subscription.id}. Reiniciando contadores.`);
        cvService.resetOneTimePlanCounters(subscription.id)
          .then(() => {
            console.log(`[DEBUG] useDashboardData: Contadores reiniciados para suscripción ${subscription.id}.`);
            // Opcional: Forzar una recarga de los datos del usuario para reflejar los contadores reiniciados
            // Esto podría hacerse llamando a una función de recarga de user en AuthContext,
            // o simplemente confiando en que el próximo fetch de suscripción traerá los nuevos valores.
            // Por ahora, no se fuerza una recarga explícita del user object.
          })
          .catch(error => {
            console.error(`[DEBUG] useDashboardData: Error al reiniciar contadores para suscripción ${subscription.id}:`, error);
            toast({ title: "Error", description: "No se pudieron reiniciar los contadores de su plan.", variant: "destructive" });
          });
      }
    }

  }, [user?.id, toast, user?.suscripcion]);

  // Calcular los límites de bonos y su estado aquí para devolverlos
  const bonusPeriodStart = user?.suscripcion?.bonus_periodo_start ? new Date(user.suscripcion.bonus_periodo_start) : null;
  const bonusPeriodEnd = user?.suscripcion?.bonus_periodo_end ? new Date(user.suscripcion.bonus_periodo_end) : null;
  const now = new Date();

  const hasBonusLimits = (user?.suscripcion?.one_time_cv_bonus || 0) > 0 || (user?.suscripcion?.one_time_job_bonus || 0) > 0 || (user?.suscripcion?.one_time_match_bonus || 0) > 0;
  const hasConsumedBonusCv = (user?.suscripcion?.cvs_analizados_este_periodo || 0) >= (user?.suscripcion?.one_time_cv_bonus || 0);
  const hasConsumedBonusJobs = jobs.length >= (user?.suscripcion?.one_time_job_bonus || 0);
  const hasConsumedBonusMatches = (user?.suscripcion?.mach_analizados_este_periodo || 0) >= (user?.suscripcion?.one_time_match_bonus || 0);

  const isBonusPlanActiveCalculated = hasBonusLimits && (
    (!bonusPeriodStart && !bonusPeriodEnd) || // Si no hay fechas, se asume activo si hay límites
    (bonusPeriodStart && bonusPeriodEnd && now >= bonusPeriodStart && now <= bonusPeriodEnd) // Si hay fechas, debe estar dentro del período
  ) && (!hasConsumedBonusCv || !hasConsumedBonusJobs || !hasConsumedBonusMatches); // Y no todos los bonos deben estar consumidos

  return {
    cvFiles,
    setCvFiles,
    jobs,
    setJobs,
    isLoadingCVs,
    isLoadingJobs,
    // Nuevo: Devolver información de la suscripción y el límite
    userSubscription: user?.suscripcion,
    effectiveLimits: calculateEffectivePlan(user?.suscripcion, jobs.length),
    isBonusPlanActive: isBonusPlanActiveCalculated, // Devolver el estado calculado de los bonos
    isBasePlanActive: calculateEffectivePlan(user?.suscripcion, jobs.length).isBasePlanActive, // Nuevo
    basePlan: calculateEffectivePlan(user?.suscripcion, jobs.length).basePlan, // Nuevo
    bonusCvUsed: user?.suscripcion?.cvs_analizados_este_periodo || 0,
    bonusJobUsed: user?.suscripcion?.jobs_analizados_este_periodo || 0, // Asumiendo que jobs_analizados_este_periodo existe
    bonusMatchUsed: user?.suscripcion?.mach_analizados_este_periodo || 0,
    bonusCvTotal: user?.suscripcion?.one_time_cv_bonus || 0,
    bonusJobTotal: user?.suscripcion?.one_time_job_bonus || 0,
    bonusMatchTotal: user?.suscripcion?.one_time_match_bonus || 0,
    // Los siguientes ya se calculan dentro de effectiveLimits, pero los mantengo para compatibilidad si se usan directamente
    analysisLimit: calculateEffectivePlan(user?.suscripcion, jobs.length).cvLimit,
    jobLimit: calculateEffectivePlan(user?.suscripcion, jobs.length).jobLimit,
    matchLimit: calculateEffectivePlan(user?.suscripcion, jobs.length).matchLimit,
    currentAnalysisCount: user?.suscripcion?.cvs_analizados_este_periodo || 0,
    currentMatchCount: user?.suscripcion?.mach_analizados_este_periodo || 0,
    currentJobCount: jobs.length,
    isSubscriptionActive: calculateEffectivePlan(user?.suscripcion, jobs.length).isSubscriptionActive,
    periodEndsAt: calculateEffectivePlan(user?.suscripcion, jobs.length).periodEndsAt,
  };
}