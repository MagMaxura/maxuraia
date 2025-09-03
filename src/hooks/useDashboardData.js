import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cvService } from '@/services/cvService.js';
import { useToast } from "@/components/ui/use-toast";
import { APP_PLANS, PLAN_CV_ANALYSIS_LIMITS, calculateEffectivePlan } from '@/config/plans';

export function useDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingCVs, setIsLoadingCVs] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const initialLoadAttemptedForUserIdRef = useRef(null);

  // Función para cargar CVs y candidatos
  const loadUserCandidatosYCVs = async (userIdToLoad) => {
    setIsLoadingCVs(true);
    try {
      const fetchedCandidatos = await cvService.getCandidatosConCVsByRecruiterId(userIdToLoad);
      
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
            uploadedDate: (cvPrincipal?.created_at || candidato.created_at) ? new Date(cvPrincipal.created_at || candidato.created_at) : null, // Fecha del CV o del candidato, asegurando que sea un objeto Date válido o null
            cv_database_id: cvPrincipal?.id || candidato.cv_id || null, // Usar candidato.cv_id como fallback
            candidate_database_id: candidato.id,
          };
        });
        setCvFiles(formattedData);
      } catch (error) {
        console.error("useDashboardData: Error fetching user Candidatos/CVs:", error);
        toast({ title: "Error al cargar Candidatos", description: "No se pudieron cargar tus candidatos guardados.", variant: "destructive" });
        setCvFiles([]);
      } finally {
        setIsLoadingCVs(false);
      }
  };

  // Función para cargar puestos de trabajo
  const loadUserJobs = async (userIdToLoad) => {
    setIsLoadingJobs(true);
    try {
      const fetchedJobs = await cvService.getJobsByRecruiterId(userIdToLoad);
      setJobs(fetchedJobs || []);
    } catch (error) {
      console.error("useDashboardData: Error fetching user Jobs:", error);
      toast({ title: "Error al cargar Puestos", description: "No se pudieron cargar tus puestos de trabajo guardados.", variant: "destructive" });
      setJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Función para refrescar todos los datos del dashboard
  const refreshDashboardData = async () => {
    const currentUserId = user?.id;
    if (currentUserId) {
      await loadUserCandidatosYCVs(currentUserId);
      await loadUserJobs(currentUserId);
    }
  };

  useEffect(() => {
    const currentUserId = user?.id;

    if (!currentUserId) {
      setCvFiles([]);
      setJobs([]);
      setIsLoadingCVs(false);
      setIsLoadingJobs(false);
      initialLoadAttemptedForUserIdRef.current = null; // Reiniciar ref
      return;
    }
 
    if (initialLoadAttemptedForUserIdRef.current !== currentUserId) {
      initialLoadAttemptedForUserIdRef.current = currentUserId;
      refreshDashboardData(); // Usar la nueva función de refresco
    } else {
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
        cvService.resetOneTimePlanCounters(subscription.id)
          .then(() => {
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

  }, [user?.id, toast, user?.suscripcion, refreshDashboardData]); // Añadir refreshDashboardData a las dependencias

  // Calcular los límites de bonos y su estado aquí para devolverlos
  const bonusPeriodStart = user?.suscripcion?.bonus_periodo_start ? new Date(user.suscripcion.bonus_periodo_start) : null;
  const bonusPeriodEnd = user?.suscripcion?.bonus_periodo_end ? new Date(user.suscripcion.bonus_periodo_end) : null;
  const now = new Date();

  const hasBonusLimits = (user?.suscripcion?.one_time_cv_bonus || 0) > 0 || (user?.suscripcion?.one_time_job_bonus || 0) > 0 || (user?.suscripcion?.one_time_match_bonus || 0) > 0;
  const hasConsumedBonusCv = (user?.suscripcion?.cvs_analizados_este_periodo || 0) >= (user?.suscripcion?.one_time_cv_bonus || 0);
  const hasConsumedBonusJobs = jobs.length >= (user?.suscripcion?.one_time_job_bonus || 0);
  const hasConsumedBonusMatches = (user?.suscripcion?.one_time_match_bonus || 0) >= (user?.suscripcion?.one_time_cv_bonus || 0);

  const isBonusPlanActiveCalculated = hasBonusLimits && (
    (!bonusPeriodStart && !bonusPeriodEnd) || // Si no hay fechas, se asume activo si hay límites
    (bonusPeriodStart && bonusPeriodEnd && now >= bonusPeriodStart && now <= bonusPeriodEnd) // Si hay fechas, debe estar dentro del período
  ) && (!hasConsumedBonusCv || !hasConsumedBonusJobs || !hasConsumedBonusMatches); // Y no todos los bonos deben estar consumidos

  const effectiveLimits = useMemo(() => {
    return calculateEffectivePlan(user?.suscripcion, jobs.length);
  }, [user?.suscripcion, jobs.length]);

  return {
    cvFiles,
    setCvFiles,
    jobs,
    setJobs,
    isLoadingCVs,
    isLoadingJobs,
    userSubscription: user?.suscripcion,
    effectiveLimits: effectiveLimits,
    isBonusPlanActive: isBonusPlanActiveCalculated,
    isBasePlanActive: effectiveLimits.isBasePlanActive,
    basePlan: effectiveLimits.basePlan,
    bonusCvUsed: user?.suscripcion?.cvs_analizados_este_periodo || 0,
    bonusJobUsed: user?.suscripcion?.jobs_analizados_este_periodo || 0,
    bonusMatchUsed: user?.suscripcion?.one_time_match_bonus || 0,
    bonusCvTotal: user?.suscripcion?.one_time_cv_bonus || 0,
    bonusJobTotal: user?.suscripcion?.one_time_job_bonus || 0,
    bonusMatchTotal: user?.suscripcion?.one_time_cv_bonus || 0,
    analysisLimit: effectiveLimits.cvLimit,
    jobLimit: effectiveLimits.jobLimit,
    matchLimit: effectiveLimits.matchLimit,
    currentAnalysisCount: effectiveLimits.cvs_used,
    currentMatchCount: effectiveLimits.matches_used,
    currentJobCount: effectiveLimits.jobs_used,
    isSubscriptionActive: effectiveLimits.isSubscriptionActive,
    periodEndsAt: effectiveLimits.periodEndsAt,
    refreshDashboardData, // Devolver la función de refresco
  };
}