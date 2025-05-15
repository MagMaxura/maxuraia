import { useState, useEffect, useRef } from 'react'; // Reintroducir useRef
import { useAuth } from '@/contexts/AuthContext';
import { cvService } from '@/services/cvService.js';
import { useToast } from "@/components/ui/use-toast";

export function useDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingCVs, setIsLoadingCVs] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const initialLoadAttemptedForUserIdRef = useRef(null);

  useEffect(() => {
    const currentUserId = user?.id;

    const loadUserCVs = async (userIdToLoad) => {
      console.log("useDashboardData: Fetching CVs for recruiterId:", userIdToLoad);
      setIsLoadingCVs(true);
      try {
        const fetchedCVs = await cvService.getCVsByRecruiterId(userIdToLoad);
        console.log("useDashboardData: Fetched CVs from DB:", fetchedCVs);
        const formattedCVs = fetchedCVs.map(dbCv => {
          let analysisData = dbCv.analysis_result || {};
          if (dbCv.content && (!analysisData.textoCompleto || analysisData.textoCompleto.trim() === '')) {
            analysisData.textoCompleto = dbCv.content;
          }
          const candidateData = Array.isArray(dbCv.candidatos) ? dbCv.candidatos[0] : dbCv.candidatos;
          if (candidateData && Array.isArray(candidateData.skills) && (!analysisData.habilidades || typeof analysisData.habilidades !== 'object')) {
            analysisData.habilidades = {
              tecnicas: candidateData.skills,
              blandas: []
            };
          } else if (analysisData.habilidades && !analysisData.habilidades.tecnicas && !analysisData.habilidades.blandas && Array.isArray(analysisData.habilidades)) {
             analysisData.habilidades = { tecnicas: analysisData.habilidades, blandas: [] };
          }
          return {
            name: dbCv.file_name || `CV ${dbCv.id}`,
            originalFile: null,
            analysis: analysisData,
            uploadedDate: new Date(dbCv.created_at),
            cv_database_id: dbCv.id,
            candidate_database_id: candidateData?.id || null,
          };
        });
        setCvFiles(formattedCVs);
      } catch (error) {
        console.error("useDashboardData: Error fetching user CVs:", error);
        toast({ title: "Error al cargar CVs", description: "No se pudieron cargar tus CVs guardados.", variant: "destructive" });
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
      loadUserCVs(currentUserId);
      loadUserJobs(currentUserId);
    } else {
      console.log(`useDashboardData useEffect: Initial load already attempted for userId ${currentUserId}. Skipping.`);
      // Si ya se intentó la carga y las listas están vacías, isLoading debería ser false.
      // Esto previene que se muestre "Cargando..." indefinidamente si no hay datos.
      if (cvFiles.length === 0 && isLoadingCVs) setIsLoadingCVs(false);
      if (jobs.length === 0 && isLoadingJobs) setIsLoadingJobs(false);
    }

  }, [user?.id, toast]); // Dependencias principales: user.id y toast.
                         // Las funciones de seteo de estado y refs no necesitan estar aquí.

  return {
    cvFiles,
    setCvFiles,
    jobs,
    setJobs,
    isLoadingCVs,
    isLoadingJobs,
  };
}