import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { processJobMatches } from "@/services/matchingService.js";
import { supabase } from "@/lib/supabase";
import { useCvUploader } from "@/hooks/useCvUploader.js";
import { parseAnalysisText } from "@/lib/quickAnalysisUtils.js";

export const useQuickAnalysis = ({
  jobs = [],
  recruiterId,
  refreshDashboardData,
  currentAnalysisCount,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t: translate } = useTranslation();

  const fileInputRef = useRef(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingExistingMatches, setIsLoadingExistingMatches] = useState(false);

  // Estado para combinar el procesamiento del uploader y el análisis de matching
  const [cvProcessingAndMatchingStatus, setCvProcessingAndMatchingStatus] = useState([]);

  const handleAnalyzeCVs = useCallback(async (filesToAnalyze, job) => {
    if (!job) {
      toast({
        title: translate("error_title"),
        description: "Por favor, selecciona un puesto de trabajo para realizar el análisis.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      return;
    }

    if (!filesToAnalyze || filesToAnalyze.length === 0) {
      toast({
        title: translate("error_title"),
        description: "No hay CVs para analizar.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    let successfulMatches = 0;
    const newAnalysisResults = [];
    const candidateIdsToProcessForMatching = [];

    // Actualizar el estado de matching para los archivos que están listos para el análisis
    setCvProcessingAndMatchingStatus(prev => prev.map(file => {
      const fileInBatch = filesToAnalyze.find(f => f.id === file.id);
      if (fileInBatch && fileInBatch.status === 'completed' && fileInBatch.databaseId) {
        candidateIdsToProcessForMatching.push(fileInBatch.databaseId);
        return { ...file, matchingStatus: 'matching_in_progress' };
      } else if (fileInBatch && (fileInBatch.status === 'duplicate' || fileInBatch.status === 'error' || fileInBatch.status === 'skipped')) {
        // Si el archivo ya tiene un estado final del uploader, no necesita matching
        return { ...file, matchingStatus: fileInBatch.status };
      }
      return file;
    }));

    if (candidateIdsToProcessForMatching.length > 0) {
      try {
        const matchResults = await processJobMatches(job.id, recruiterId, candidateIdsToProcessForMatching);

        matchResults.forEach(match => {
          const candidate = filesToAnalyze.find(f => f.databaseId === match.candidato_id);
          const cvFileName = candidate ? candidate.name : `Candidato ID: ${match.candidato_id}`;
          const analysis = candidate?.analysisResult;

          if (match.error) {
            newAnalysisResults.push({
              cvFileName: cvFileName,
              jobTitle: job.title,
              matchScore: match.match_score,
              candidateId: match.candidato_id,
              jobId: job.id,
              status: "error",
              message: match.analysis || match.saveError || "Error durante el macheo.",
              analysisDecision: 'N/A',
              analysisReasoning: 'N/A',
              analysisSummary: 'N/A',
            });
            setCvProcessingAndMatchingStatus(prev => prev.map(file =>
              file.databaseId === match.candidato_id ? { ...file, matchingStatus: 'matching_error', matchScore: match.match_score, analysisDecision: 'N/A', analysisSummary: 'N/A' } : file
            ));
          } else {
            const parsedAnalysis = analysis ? parseAnalysisText(analysis.analysis_text) : { decision: 'N/A', reasoning: 'N/A', summary: 'N/A', recommendation_boolean: false };
            newAnalysisResults.push({
              cvFileName: cvFileName,
              jobTitle: job.title,
              matchScore: match.match_score,
              candidateId: match.candidato_id,
              jobId: job.id,
              status: "completed",
              analysisDecision: parsedAnalysis.decision,
              analysisReasoning: parsedAnalysis.reasoning,
              analysisSummary: parsedAnalysis.summary,
              recommendationBoolean: parsedAnalysis.recommendation_boolean,
            });
            successfulMatches++;
            setCvProcessingAndMatchingStatus(prev => prev.map(file =>
              file.databaseId === match.candidato_id ? { ...file, matchingStatus: 'matching_completed', matchScore: match.match_score, analysisDecision: parsedAnalysis.decision, analysisSummary: parsedAnalysis.summary } : file
            ));
          }
        });
      } catch (error) {
        console.error("useQuickAnalysis: Error during batch matching:", error);
        toast({
          title: translate("error_title"),
          description: `Error durante el macheo de CVs: ${error.message}`,
          variant: "destructive",
        });
        candidateIdsToProcessForMatching.forEach(candidateId => {
          const existingEntryIndex = newAnalysisResults.findIndex(res => res.candidateId === candidateId && res.jobId === job.id);
          if (existingEntryIndex === -1) {
            const candidate = filesToAnalyze.find(f => f.databaseId === candidateId);
            newAnalysisResults.push({
              cvFileName: candidate ? candidate.name : `Candidato ID: ${candidateId}`,
              jobTitle: job.title,
              status: "error",
              message: error.message,
              analysisDecision: 'N/A',
              analysisSummary: 'N/A',
              candidateId: candidateId,
              jobId: job.id,
            });
          } else {
            newAnalysisResults[existingEntryIndex] = {
              ...newAnalysisResults[existingEntryIndex],
              status: "error",
              message: error.message,
            };
          }
          setCvProcessingAndMatchingStatus(prev => prev.map(file =>
            file.databaseId === candidateId ? { ...file, matchingStatus: 'matching_error', matchScore: 'N/A', analysisDecision: 'N/A', analysisSummary: 'N/A' } : file
          ));
        });
      }
    }

    setAnalysisResults(prevResults => {
      const updatedResults = [...prevResults];
      newAnalysisResults.forEach(newRes => {
        const existingIndex = updatedResults.findIndex(
          (res) => res.candidateId === newRes.candidateId && res.jobId === newRes.jobId
        );
        if (existingIndex > -1) {
          updatedResults[existingIndex] = newRes;
        } else {
          updatedResults.push(newRes);
        }
      });
      return updatedResults;
    });
    
    setIsAnalyzing(false);
    resetUploaderState();
    refreshDashboardData();

    if (successfulMatches > 0) {
      toast({
        title: translate("quick_analysis_completed_title"),
        description: translate("quick_analysis_completed_description", { count: successfulMatches, jobTitle: job.title }),
      });
    } else if (newAnalysisResults.length > 0) {
      toast({
        title: translate("quick_analysis_warnings_title"),
        description: translate("quick_analysis_warnings_description"),
        variant: "warning",
      });
    } else {
      toast({
        title: translate("warning_text"),
        description: translate("quick_analysis_no_completion_description"),
        variant: "destructive",
      });
    }
  }, [toast, translate, setIsAnalyzing, recruiterId, parseAnalysisText, processJobMatches, refreshDashboardData, setCvProcessingAndMatchingStatus]);

  const {
    isProcessing,
    isBulkProcessing,
    totalFilesToUpload,
    filesUploadedCount,
    currentFileProcessingName,
    handleFileUpload,
    handleDragOver,
    handleDrop,
    resetUploaderState: resetUploaderStateFromHook,
    processingFiles: uploaderProcessingFiles,
  } = useCvUploader({
    fileInputRef,
    setCvFiles: () => {},
    setSelectedCV: () => {},
    setCvAnalysis: () => {},
    setActiveTab: () => {},
    currentCvCount: currentAnalysisCount,
    refreshDashboardData,
    onUploadComplete: useCallback((processedFiles) => {
      if (selectedJob) {
        // Cuando la carga del uploader termina, inicializar el estado de matching
        // para los archivos que fueron 'completed' por el uploader.
        const initialMatchingStatus = processedFiles.map(file => ({
          ...file,
          matchingStatus: file.status === 'completed' ? 'matching_pending' : file.status,
          matchScore: 'N/A',
          analysisDecision: 'N/A',
          analysisSummary: 'N/A',
        }));
        setCvProcessingAndMatchingStatus(initialMatchingStatus);
        handleAnalyzeCVs(initialMatchingStatus, selectedJob);
      } else {
        toast({
          title: translate("error_title"),
          description: translate("select_job_before_analysis"),
          variant: "destructive",
        });
        setIsAnalyzing(false);
        // Si no hay job seleccionado, los archivos procesados por el uploader
        // deben mostrarse con su estado final del uploader.
        setCvProcessingAndMatchingStatus(processedFiles.map(file => ({
          ...file,
          matchingStatus: file.status, // No hay matching, el estado final es el del uploader
          matchScore: 'N/A',
          analysisDecision: 'N/A',
          analysisSummary: 'N/A',
        })));
      }
    }, [selectedJob, toast, translate, setIsAnalyzing, setCvProcessingAndMatchingStatus, handleAnalyzeCVs]),
  });

  // Este useEffect se encargará de actualizar cvProcessingAndMatchingStatus
  // con el progreso del uploader *antes* de que onUploadComplete se dispare.
  useEffect(() => {
    if (uploaderProcessingFiles.length > 0) {
      setCvProcessingAndMatchingStatus(prev => {
        const updated = [...prev];
        uploaderProcessingFiles.forEach(uploaderFile => {
          const existingIndex = updated.findIndex(f => f.id === uploaderFile.id);
          if (existingIndex > -1) {
            // Actualizar solo el estado de carga/procesamiento si ha cambiado
            if (updated[existingIndex].status !== uploaderFile.status || updated[existingIndex].progress !== uploaderFile.progress) {
              updated[existingIndex] = { ...updated[existingIndex], ...uploaderFile };
            }
          } else {
            // Añadir nuevos archivos del uploader con estado inicial de matching 'pending'
            updated.push({
              ...uploaderFile,
              matchingStatus: 'pending', // Estado inicial de matching
              matchScore: 'N/A',
              analysisDecision: 'N/A',
              analysisSummary: 'N/A',
            });
          }
        });
        return updated;
      });
    } else if (uploaderProcessingFiles.length === 0 && cvProcessingAndMatchingStatus.length > 0 && !isAnalyzing) {
      // Limpiar si no hay archivos en el uploader y no estamos analizando
      setCvProcessingAndMatchingStatus([]);
    }
  }, [uploaderProcessingFiles, isAnalyzing, cvProcessingAndMatchingStatus.length]);


  const resetUploaderState = resetUploaderStateFromHook;

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setIsDialogOpen(false);
    // Limpiar el estado de procesamiento cuando se selecciona un nuevo puesto
    setCvProcessingAndMatchingStatus([]);
  };

  const fetchExistingMatchesForJob = useCallback(async (jobId) => {
    if (!jobId || !recruiterId) {
      setAnalysisResults([]);
      setCvProcessingAndMatchingStatus([]); // Limpiar también el estado de procesamiento
      return;
    }
    setIsLoadingExistingMatches(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select(`
          *,
          candidatos (id, name)
        `)
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });

      if (fetchError) {
        console.error("useQuickAnalysis: Error fetching existing matches:", fetchError);
        throw fetchError;
      }

      const formattedResults = data.map(match => {
        const analysisText = match.analysis || '';
        const parsed = parseAnalysisText(analysisText);
        return {
          cvFileName: match.candidatos?.name || 'N/A',
          jobTitle: jobs.find(j => j.id === jobId)?.title || 'N/A',
          matchScore: match.match_score,
          candidateId: match.candidato_id,
          jobId: match.job_id,
          status: "completed", // Este es el estado del resultado final
          matchingStatus: "matching_completed", // Nuevo estado para el proceso de matching
          analysisDecision: parsed.decision,
          analysisReasoning: parsed.reasoning,
          analysisSummary: parsed.summary,
          recommendationBoolean: parsed.recommendation_boolean,
        };
      }) || [];
      
      setAnalysisResults(formattedResults);
      // También actualizar cvProcessingAndMatchingStatus con los resultados existentes
      setCvProcessingAndMatchingStatus(formattedResults.map(res => ({
        id: res.candidateId, // Usar candidateId como id temporal para consistencia
        name: res.cvFileName,
        status: 'completed', // Estado del uploader si ya existe
        progress: 100,
        file: null,
        analysisResult: null, // No tenemos el análisis completo aquí
        databaseId: res.candidateId,
        matchingStatus: res.matchingStatus,
        matchScore: res.matchScore,
        analysisDecision: res.analysisDecision,
        analysisSummary: res.analysisSummary,
      })));

    } catch (err) {
      console.error("useQuickAnalysis: Error in fetchExistingMatchesForJob:", err);
      toast({ title: translate("error_title"), description: translate("error_loading_existing_analysis"), variant: "destructive" });
      setAnalysisResults([]);
      setCvProcessingAndMatchingStatus([]);
    } finally {
      setIsLoadingExistingMatches(false);
    }
  }, [toast, jobs, recruiterId, parseAnalysisText, setCvProcessingAndMatchingStatus]);

  useEffect(() => {
    if (selectedJob && recruiterId) {
      fetchExistingMatchesForJob(selectedJob.id);
    } else {
      setAnalysisResults([]);
      setCvProcessingAndMatchingStatus([]); // Limpiar también el estado de procesamiento
    }
  }, [selectedJob, recruiterId, fetchExistingMatchesForJob, setCvProcessingAndMatchingStatus]);

  return {
    fileInputRef,
    selectedJob,
    setSelectedJob,
    isAnalyzing,
    analysisResults,
    searchTerm,
    setSearchTerm,
    isDialogOpen,
    setIsDialogOpen,
    isLoadingExistingMatches,
    isProcessing,
    isBulkProcessing,
    totalFilesToUpload,
    filesUploadedCount,
    currentFileProcessingName,
    handleFileUpload,
    handleDragOver,
    handleDrop,
    resetUploaderState,
    filteredJobs,
    handleSelectJob,
    fetchExistingMatchesForJob,
    translate, // Expose t for translation in components
    uploaderProcessingFiles, // Exponer el estado de procesamiento de archivos
    cvProcessingAndMatchingStatus, // Exponer el nuevo estado combinado
  };
};