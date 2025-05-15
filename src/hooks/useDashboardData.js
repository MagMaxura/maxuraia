import { useState, useEffect } from 'react'; // Eliminado useRef
import { useAuth } from '@/contexts/AuthContext';
import { cvService } from '@/services/cvService.js';
import { useToast } from "@/components/ui/use-toast";

export function useDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingCVs, setIsLoadingCVs] = useState(false); // Iniciar en false
  const [isLoadingJobs, setIsLoadingJobs] = useState(false); // Iniciar en false

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
        setCvFiles([]); // Asegurar que cvFiles esté vacío en caso de error
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
        setJobs([]); // Asegurar que jobs esté vacío en caso de error
      } finally {
        setIsLoadingJobs(false);
      }
    };

    if (!currentUserId) {
      console.log("useDashboardData useEffect: No currentUserId. Clearing data.");
      setCvFiles([]);
      setJobs([]);
      setIsLoadingCVs(false);
      setIsLoadingJobs(false);
      return;
    }

    // Cargar CVs si hay usuario, la lista está vacía y no se está cargando actualmente
    if (cvFiles.length === 0 && !isLoadingCVs) {
      console.log(`useDashboardData useEffect: currentUserId is ${currentUserId}, cvFiles is empty, and not loading. Triggering CVs load.`);
      loadUserCVs(currentUserId);
    } else if (cvFiles.length > 0 && isLoadingCVs) {
      // Si hay CVs pero isLoadingCVs es true (estado anómalo), forzar a false.
      console.warn("useDashboardData useEffect: cvFiles has data, but isLoadingCVs is true. Setting isLoadingCVs to false.");
      setIsLoadingCVs(false);
    }

    // Cargar Jobs si hay usuario, la lista está vacía y no se está cargando actualmente
    if (jobs.length === 0 && !isLoadingJobs) {
      console.log(`useDashboardData useEffect: currentUserId is ${currentUserId}, jobs is empty, and not loading. Triggering Jobs load.`);
      loadUserJobs(currentUserId);
    } else if (jobs.length > 0 && isLoadingJobs) {
      // Si hay Jobs pero isLoadingJobs es true (estado anómalo), forzar a false.
      console.warn("useDashboardData useEffect: jobs has data, but isLoadingJobs is true. Setting isLoadingJobs to false.");
      setIsLoadingJobs(false);
    }

  }, [user?.id, cvFiles.length, jobs.length, isLoadingCVs, isLoadingJobs, toast]);
  // Se incluyen cvFiles.length, jobs.length, isLoadingCVs, isLoadingJobs en las dependencias
  // para que el efecto se re-ejecute si estos cambian y la lógica condicional pueda actuar.

  return {
    cvFiles,
    setCvFiles,
    jobs,
    setJobs,
    isLoadingCVs,
    isLoadingJobs,
  };
}