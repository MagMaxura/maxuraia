import { useState, useEffect, useRef } from 'react'; // Importar useRef
import { useAuth } from '@/contexts/AuthContext'; // Asumiendo la ruta correcta
import { cvService } from '@/services/cvService.js'; // Asumiendo la ruta correcta
import { useToast } from "@/components/ui/use-toast"; // Asumiendo la ruta correcta

export function useDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingCVs, setIsLoadingCVs] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const loadedForUserIdRef = useRef(null); // Ref para rastrear para qué userId se cargaron datos

  useEffect(() => {
    const currentUserId = user?.id;
    console.log(`useDashboardData useEffect: currentUserId is ${currentUserId}, loadedForUserIdRef.current is ${loadedForUserIdRef.current}`);

    const loadUserCVs = async (userId) => {
      console.log("useDashboardData: Fetching CVs for recruiterId:", userId);
      setIsLoadingCVs(true);
      try {
        const fetchedCVs = await cvService.getCVsByRecruiterId(userId);
        console.log("useDashboardData: Fetched CVs from DB:", fetchedCVs);
        const formattedCVs = fetchedCVs.map(dbCv => {
          let analysisData = dbCv.analysis_result || {};
          if (dbCv.content && (!analysisData.textoCompleto || analysisData.textoCompleto.trim() === '')) {
            analysisData.textoCompleto = dbCv.content;
          }
          if (dbCv.candidatos && Array.isArray(dbCv.candidatos.skills) && (!analysisData.habilidades || typeof analysisData.habilidades !== 'object')) {
            analysisData.habilidades = {
              tecnicas: dbCv.candidatos.skills,
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
            candidate_database_id: dbCv.candidatos?.id || null,
          };
        });
        setCvFiles(formattedCVs);
      } catch (error) {
        console.error("useDashboardData: Error fetching user CVs:", error);
        toast({ title: "Error al cargar CVs", description: "No se pudieron cargar tus CVs guardados.", variant: "destructive" });
      } finally {
        setIsLoadingCVs(false);
      }
    };

    const loadUserJobs = async (userId) => {
      console.log("useDashboardData: Fetching Jobs for recruiterId:", userId);
      setIsLoadingJobs(true);
      try {
        const fetchedJobs = await cvService.getJobsByRecruiterId(userId);
        console.log("useDashboardData: Fetched Jobs from DB:", fetchedJobs);
        setJobs(fetchedJobs || []);
      } catch (error) {
        console.error("useDashboardData: Error fetching user Jobs:", error);
        toast({ title: "Error al cargar Puestos", description: "No se pudieron cargar tus puestos de trabajo guardados.", variant: "destructive" });
      } finally {
        setIsLoadingJobs(false);
      }
    };

    if (currentUserId && loadedForUserIdRef.current !== currentUserId) {
      console.log(`useDashboardData: Condition met. Loading data for userId: ${currentUserId}. Previous loaded ID: ${loadedForUserIdRef.current}`);
      loadedForUserIdRef.current = currentUserId; // Marcar que estamos iniciando la carga para este ID

      // Establecer estados de carga a true ANTES de las llamadas async
      setIsLoadingCVs(true);
      setIsLoadingJobs(true);

      console.log("useDashboardData: Calling loadUserCVs...");
      loadUserCVs(currentUserId);
      console.log("useDashboardData: Calling loadUserJobs...");
      loadUserJobs(currentUserId);

    } else if (!currentUserId) {
      console.log("useDashboardData: No currentUserId. Clearing data and resetting loadedForUserIdRef.");
      setCvFiles([]);
      setJobs([]);
      setIsLoadingCVs(false);
      setIsLoadingJobs(false);
      loadedForUserIdRef.current = null;
    } else if (currentUserId && loadedForUserIdRef.current === currentUserId) {
      console.log(`useDashboardData: Data already marked as loaded or loading for userId ${currentUserId}. Skipping new fetch.`);
      // Si los datos ya se cargaron, los estados de isLoading deberían ser false.
      // Si todavía están cargando de una ejecución anterior de este efecto, se mantendrán true.
      // No es necesario cambiar isLoading aquí a menos que queramos forzarlo a false si hay datos.
      // if (cvFiles.length > 0) setIsLoadingCVs(false); // Ejemplo, pero puede ser problemático
      // if (jobs.length > 0) setIsLoadingJobs(false);
    }
  }, [user?.id, toast]); // Dependemos de user.id y toast (usado por las funciones internas)
                         // Las funciones de seteo de estado son estables.

  return {
    cvFiles,
    setCvFiles, // Exponer para que Dashboard pueda actualizarlo (ej. después de subir/eliminar CV)
    jobs,
    setJobs,   // Exponer para que Dashboard pueda actualizarlo (ej. después de crear/eliminar Job)
    isLoadingCVs,
    isLoadingJobs,
    // Podríamos también exponer fetchUserCVs y fetchUserJobs si se necesita recargar manualmente desde el Dashboard
    // pero por ahora, la carga se maneja internamente con el cambio de user.id
  };
}