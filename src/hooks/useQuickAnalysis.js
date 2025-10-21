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

  const handleAnalyzeCVs = useCallback(async (processedFiles, job) => {
    if (!job) {
      toast({
        title: translate("error_title"),
        description: "Por favor, selecciona un puesto de trabajo para realizar el análisis.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      return;
    }

    if (!processedFiles || processedFiles.length === 0) {
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

    for (const processedFile of processedFiles) {
      const cvFileName = processedFile.name;

      if (processedFile.status === 'duplicate') {
        newAnalysisResults.push({
          cvFileName: cvFileName,
          jobTitle: job.title,
          status: "duplicate",
          message: `El CV "${cvFileName}" ya existe en tu base de datos.`,
          analysisDecision: processedFile.analysisResult ? parseAnalysisText(processedFile.analysisResult.analysis_text).decision : 'N/A',
          analysisSummary: processedFile.analysisResult ? parseAnalysisText(processedFile.analysisResult.analysis_text).summary : 'N/A',
          candidateId: processedFile.databaseId,
          jobId: job.id,
        });
        continue;
      }

      if (processedFile.status === 'error' || processedFile.status === 'skipped') {
        newAnalysisResults.push({
          cvFileName: cvFileName,
          jobTitle: job.title,
          status: "error",
          message: processedFile.analysisResult?.message || "Error desconocido durante el procesamiento.",
          analysisDecision: 'N/A',
          analysisSummary: 'N/A',
          candidateId: processedFile.databaseId,
          jobId: job.id,
        });
        continue;
      }

      if (processedFile.status === 'completed' && processedFile.databaseId) {
        candidateIdsToProcessForMatching.push(processedFile.databaseId);
      } else {
        newAnalysisResults.push({
          cvFileName: cvFileName,
          jobTitle: job.title,
          status: "error",
          message: "CV procesado pero sin ID de candidato para macheo.",
          analysisDecision: 'N/A',
          analysisSummary: 'N/A',
          jobId: job.id,
        });
      }
    }

    if (candidateIdsToProcessForMatching.length > 0) {
      try {
        const matchResults = await processJobMatches(job.id, recruiterId, candidateIdsToProcessForMatching);

        matchResults.forEach(match => {
          const candidate = processedFiles.find(f => f.databaseId === match.candidato_id);
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
            const candidate = processedFiles.find(f => f.databaseId === candidateId);
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
  }, [toast, translate, setIsAnalyzing, recruiterId, parseAnalysisText, processJobMatches, refreshDashboardData]);

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
        handleAnalyzeCVs(processedFiles, selectedJob);
      } else {
        toast({
          title: translate("error_title"),
          description: translate("select_job_before_analysis"),
          variant: "destructive",
        });
        setIsAnalyzing(false);
      }
    }, [selectedJob, handleAnalyzeCVs, toast, translate, setIsAnalyzing]),
  });

  const resetUploaderState = resetUploaderStateFromHook;

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setIsDialogOpen(false);
  };

  const fetchExistingMatchesForJob = useCallback(async (jobId) => {
    if (!jobId || !recruiterId) {
      setAnalysisResults([]);
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
          status: "completed",
          analysisDecision: parsed.decision,
          analysisReasoning: parsed.reasoning,
          analysisSummary: parsed.summary,
          recommendationBoolean: parsed.recommendation_boolean,
        };
      }) || [];
      
      setAnalysisResults(formattedResults);

    } catch (err) {
      console.error("useQuickAnalysis: Error in fetchExistingMatchesForJob:", err);
      toast({ title: translate("error_title"), description: translate("error_loading_existing_analysis"), variant: "destructive" });
      setAnalysisResults([]);
    } finally {
      setIsLoadingExistingMatches(false);
    }
  }, [toast, jobs, recruiterId, parseAnalysisText]);

  useEffect(() => {
    if (selectedJob && recruiterId) {
      fetchExistingMatchesForJob(selectedJob.id);
    } else {
      setAnalysisResults([]);
    }
  }, [selectedJob, recruiterId, fetchExistingMatchesForJob]);

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
  };
};