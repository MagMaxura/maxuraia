import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { FileUp, Upload, Loader2, CheckCircle2, XCircle, FileText, Search } from "lucide-react";
import { cvService } from "@/services/cvService.js";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import { processJobMatches } from "@/services/matchingService.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useCvUploader } from "@/hooks/useCvUploader.js";
import { useNavigate } from "react-router-dom";
import EditableCV from '../EditableCV';
import CandidateNotes from '../CandidateNotes';

const parseAnalysisText = (analysisText) => {
  if (!analysisText || typeof analysisText !== 'string') {
    return { decision: 'N/A', reasoning: 'N/A', summary: analysisText || 'N/A', recommendation_boolean: false };
  }

  let decision = 'N/A';
  let reasoning = 'N/A';
  let summary = analysisText; // Fallback inicial
  let recommendation_boolean = false;

  const newFormatDecisionMatch = analysisText.match(/Decisión de Recomendación: (.*?)\.(?: Razonamiento:|$)/i);
  if (newFormatDecisionMatch && newFormatDecisionMatch[1]) {
    decision = newFormatDecisionMatch[1].trim();
    recommendation_boolean = decision.toLowerCase() === 'sí';

    const newFormatReasoningMatch = analysisText.match(/Razonamiento: (.*?)\.(?: Resumen General:|$)/i);
    if (newFormatReasoningMatch && newFormatReasoningMatch[1]) {
      reasoning = newFormatReasoningMatch[1].trim();
    }

    const newFormatSummaryMatch = analysisText.match(/Resumen General: (.*)/i);
    if (newFormatSummaryMatch && newFormatSummaryMatch[1]) {
      summary = newFormatSummaryMatch[1].trim();
    } else if (newFormatReasoningMatch && newFormatReasoningMatch[0]) {
        const reasoningEndIndex = analysisText.toLowerCase().indexOf(newFormatReasoningMatch[0].toLowerCase()) + newFormatReasoningMatch[0].length;
        summary = analysisText.substring(reasoningEndIndex).trim();
         if(summary.startsWith(".")) summary = summary.substring(1).trim();
    } else {
         const decisionEndIndex = analysisText.toLowerCase().indexOf(newFormatDecisionMatch[0].toLowerCase()) + newFormatDecisionMatch[0].length;
         summary = analysisText.substring(decisionEndIndex).trim();
         if(summary.startsWith(".")) summary = summary.substring(1).trim();
    }
    if (summary === "") summary = "No disponible (parseado)";

  } else {
    const oldFormatRecomMatch = analysisText.match(/Recomendación: (Sí|No|Si)\.(?: Resumen:|$)/i);
    if (oldFormatRecomMatch && oldFormatRecomMatch[1]) {
      decision = oldFormatRecomMatch[1].trim();
      recommendation_boolean = decision.toLowerCase() === 'sí' || decision.toLowerCase() === 'si';
      
      const summarySplit = analysisText.split(/Resumen: /i);
      summary = summarySplit.length > 1 ? summarySplit[1].trim() : analysisText;
      reasoning = 'N/A (formato antiguo)';
    } else {
        recommendation_boolean = analysisText.toLowerCase().includes("recomendación: sí") || analysisText.toLowerCase().includes("recomendación: si");
    }
  }
  return { decision, reasoning, summary, recommendation_boolean };
};

const QuickAnalysisTab = ({
  jobs = [],
  recruiterId,
  matchLimit,
  currentMatchCount,
  onCvUploadSuccess,
  refreshDashboardData,
  effectiveLimits,
  isBonusPlanActive,
  bonusCvUsed,
  bonusCvTotal,
  bonusMatchUsed,
  bonusMatchTotal,
  isBasePlanActive,
  basePlan,
  currentAnalysisCount,
  analysisLimit,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fileInputRef = useRef(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'match_score', direction: 'descending' });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCandidateProfileId, setSelectedCandidateProfileId] = useState(null);
  const [candidateProfileData, setCandidateProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfileNotes, setIsSavingProfileNotes] = useState(false);
  const [isLoadingExistingMatches, setIsLoadingExistingMatches] = useState(false); // Nuevo estado para cargar matches existentes

  const handleAnalyzeCVs = useCallback(async (processedFiles, job) => { // Recibir processedFiles
    if (!job) {
      toast({
        title: t("error_title"),
        description: "Por favor, selecciona un puesto de trabajo para realizar el análisis.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      return;
    }

    if (!processedFiles || processedFiles.length === 0) {
      toast({
        title: t("error_title"),
        description: "No hay CVs para analizar.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    // No limpiar analysisResults aquí, ya que queremos mantener los existentes y añadir nuevos.
    // setAnalysisResults([]); 

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
          candidateId: processedFile.databaseId, // Incluir candidateId para "Ver Detalles"
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
          candidateId: processedFile.databaseId, // Incluir candidateId para "Ver Detalles" si existe
          jobId: job.id,
        });
        continue;
      }

      // Si el archivo fue procesado exitosamente por useCvUploader
      if (processedFile.status === 'completed' && processedFile.databaseId) {
        candidateIdsToProcessForMatching.push(processedFile.databaseId);
      } else {
        // Si por alguna razón un archivo "completed" no tiene databaseId, registrarlo como error
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

    // Realizar el macheo para todos los candidatos exitosamente procesados en un solo batch
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
        console.error("QuickAnalysisTab: Error during batch matching:", error);
        toast({
          title: t("error_title"),
          description: `Error durante el macheo de CVs: ${error.message}`,
          variant: "destructive",
        });
        // Si hay un error en el batch, marcar todos los que iban a ser macheados como error
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
          updatedResults[existingIndex] = newRes; // Actualizar si ya existe
        } else {
          updatedResults.push(newRes); // Añadir si es nuevo
        }
      });
      return updatedResults;
    });
    
    setIsAnalyzing(false);
    resetUploaderState();
    refreshDashboardData(); // Refresh dashboard data to update counts

    if (successfulMatches > 0) {
      toast({
        title: "Análisis Rápido Completado",
        description: `Se analizaron ${successfulMatches} CVs contra el puesto "${job.title}".`,
      });
    } else if (newAnalysisResults.length > 0) {
      toast({
        title: "Análisis Rápido Completado con Advertencias",
        description: "Algunos CVs no pudieron ser analizados o eran duplicados.",
        variant: "warning",
      });
    } else {
      toast({
        title: t("warning_text"),
        description: "No se pudo completar el análisis para ningún CV.",
        variant: "destructive",
      });
    }
  }, [toast, t, setIsAnalyzing, recruiterId, jobs, parseAnalysisText, processJobMatches, refreshDashboardData, resetUploaderState]);

  const {
    isProcessing,
    isBulkProcessing,
    totalFilesToUpload,
    filesUploadedCount,
    currentFileProcessingName,
    handleFileUpload,
    handleDragOver,
    handleDrop,
    optimisticCvCount,
    processingFiles,
    resetUploaderState: resetUploaderStateFromHook,
  } = useCvUploader({
    fileInputRef,
    setCvFiles: () => {}, // No necesitamos actualizar cvFiles directamente aquí
    setSelectedCV: () => {},
    setCvAnalysis: () => {},
    setActiveTab: () => {},
    currentCvCount: currentAnalysisCount,
    refreshDashboardData,
    onUploadComplete: useCallback((processedFiles) => { // Recibir todos los archivos procesados
      if (selectedJob) {
        handleAnalyzeCVs(processedFiles, selectedJob);
      } else {
        toast({
          title: t("error_title"),
          description: "Por favor, selecciona un puesto de trabajo antes de analizar los CVs.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
      }
    }, [selectedJob, handleAnalyzeCVs, toast, t, setIsAnalyzing]), // Add selectedJob and handleAnalyzeCVs as dependencies
  });

  // Sobrescribir resetUploaderState para usar el del hook
  const resetUploaderState = resetUploaderStateFromHook;

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setIsDialogOpen(false);
  };

  const fetchExistingMatchesForJob = useCallback(async (jobId, recruiterId) => {
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
        console.error("QuickAnalysisTab: Error fetching existing matches:", fetchError);
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
      console.error("QuickAnalysisTab: Error in fetchExistingMatchesForJob:", err);
      toast({ title: "Error", description: "No se pudieron cargar los análisis existentes para este puesto.", variant: "destructive" });
      setAnalysisResults([]);
    } finally {
      setIsLoadingExistingMatches(false);
    }
  }, [toast, jobs, recruiterId, parseAnalysisText]); // Añadir jobs y recruiterId a las dependencias

  useEffect(() => {
    if (selectedJob && recruiterId) {
      fetchExistingMatchesForJob(selectedJob.id, recruiterId);
    } else {
      setAnalysisResults([]);
    }
  }, [selectedJob, recruiterId, fetchExistingMatchesForJob]);

  const renderProcessingStatus = () => {
    if (isBulkProcessing || isProcessing || isAnalyzing) {
      return (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div>
            <p className="text-blue-800 font-medium">
              {isAnalyzing ? "Realizando análisis rápido..." : t("processing_batch")}
            </p>
            {!isAnalyzing && (
              <p className="text-sm text-blue-700">
                {t("analyzing_file", { fileName: currentFileProcessingName })} ({filesUploadedCount}/{totalFilesToUpload})
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">{t('quick_analysis_tab')}</h2>
      <p className="text-slate-600">
        Carga CVs y compáralos automáticamente con un puesto de trabajo publicado.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-slate-700 mb-4">1. Selecciona un Puesto de Trabajo</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedJob ? selectedJob.title : "Seleccionar Puesto"}
                <Search className="ml-2 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0">
              <DialogHeader className="p-4 border-b">
                <DialogTitle>Seleccionar Puesto de Trabajo</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <Input
                  placeholder="Buscar puestos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                <ScrollArea className="h-[300px]">
                  {filteredJobs.length > 0 ? (
                    <div className="space-y-2">
                      {filteredJobs.map((job) => (
                        <Button
                          key={job.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleSelectJob(job)}
                        >
                          {job.title}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500">No se encontraron puestos.</p>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
          {selectedJob && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800">Puesto Seleccionado:</p>
              <p className="text-md text-blue-900 font-semibold">{selectedJob.title}</p>
            </div>
          )}
        </div>

        {/* CV Upload */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-slate-700 mb-4">2. Carga los CVs</h3>
          <div
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-600 text-center mb-1">{t('drag_drop_cvs_message')}</p>
            <p className="text-sm text-gray-500 text-center">{t('accepted_formats_message')}</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx"
              multiple
            />
          </div>
          {renderProcessingStatus()}
        </div>
      </div>

      {/* Analysis Results */}
      {selectedJob && (isLoadingExistingMatches || analysisResults.length > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
          <h3 className="text-xl font-semibold text-slate-700 mb-4">Resultados del Análisis para: {selectedJob.title}</h3>
          {isLoadingExistingMatches ? (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>Cargando análisis existentes...</p>
            </div>
          ) : analysisResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decisión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resumen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysisResults.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.cvFileName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.status === "completed" ? `${result.matchScore}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.status === "completed" ? result.analysisDecision : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {result.status === "completed" ? result.analysisSummary : result.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.status === "completed" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completado</span>}
                        {result.status === "error" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Error</span>}
                        {result.status === "duplicate" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Duplicado</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {result.status === "completed" && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(`/dashboard/analisis-ia?candidateId=${result.candidateId}&jobId=${result.jobId}`)}
                            className="text-blue-600 hover:text-blue-900 p-0 h-auto"
                          >
                            Ver Detalles
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !isLoadingExistingMatches && <p>No hay resultados de análisis para mostrar para este puesto. Carga CVs para analizarlos.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickAnalysisTab;