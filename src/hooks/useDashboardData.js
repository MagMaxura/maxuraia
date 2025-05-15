import { useState, useEffect, useCallback } from 'react';
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

  const fetchUserCVs = useCallback(async (userId) => {
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
  }, [toast]); // cvService no es una dependencia reactiva, toast sí

  const fetchUserJobs = useCallback(async (userId) => {
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
  }, [toast]); // cvService no es una dependencia reactiva, toast sí

  useEffect(() => {
    if (user?.id) {
      fetchUserCVs(user.id);
      fetchUserJobs(user.id);
    } else {
      setCvFiles([]);
      setJobs([]);
      setIsLoadingCVs(false); // Asegurarse de que no se quede cargando si no hay usuario
      setIsLoadingJobs(false);
    }
  }, [user?.id, fetchUserCVs, fetchUserJobs]);

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