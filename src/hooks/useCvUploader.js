import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import { cvService } from "@/services/cvService.js";
import { PLAN_CV_ANALYSIS_LIMITS } from '@/config/plans'; // Importar los límites

export function useCvUploader({
  fileInputRef, // Ref para limpiar el input de archivo
  setCvFiles, // Para añadir nuevos CVs procesados a la lista general
  setSelectedCV, // Para seleccionar el CV recién subido (si es uno solo)
  setCvAnalysis, // Para mostrar el análisis del CV recién subido
  setActiveTab, // Para cambiar a la pestaña de CVs procesados
  // cvFiles prop es necesario para calcular el índice del nuevo CV si se selecciona
  // y para evitar pasar el estado completo si solo se necesita la longitud.
  // Podríamos pasar cvFiles.length directamente si esa es la única necesidad.
  // Por ahora, pasaremos la función setCvFiles y el componente Dashboard manejará la lógica de añadir.
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [filesUploadedCount, setFilesUploadedCount] = useState(0);
  const [currentFileProcessingName, setCurrentFileProcessingName] = useState("");

  const handleFileUpload = useCallback(async (eventOrFiles) => {
    // Permite pasar un evento de input o directamente un array de archivos (para drag and drop)
    const selectedFiles = Array.isArray(eventOrFiles) ? eventOrFiles : Array.from(eventOrFiles.target.files);

    if (selectedFiles.length === 0) return;

    if (!user || !user.suscripcion) {
      toast({ title: "Error", description: "No se pudo verificar tu plan de suscripción.", variant: "destructive" });
      return;
    }

    const planId = user.suscripcion.plan_id || 'basico';
    const status = user.suscripcion.status;
    let currentAnalysisCount = user.suscripcion.cvs_analizados_este_periodo || 0;
    const analysisLimit = PLAN_CV_ANALYSIS_LIMITS[planId] === undefined ? 0 : PLAN_CV_ANALYSIS_LIMITS[planId];


    if (status !== 'active' && status !== 'trialing') {
      toast({
        title: "Suscripción no activa",
        description: "Tu suscripción no te permite analizar CVs. Revisa tu plan.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkProcessing(true);
    setIsProcessing(true);
    setTotalFilesToUpload(selectedFiles.length);
    setFilesUploadedCount(0);
    setCurrentFileProcessingName("");
    let anyErrorOccurred = false;
    let CvsProcessedInThisBatch = 0;
    const newlyProcessedCvFiles = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentFileProcessingName(file.name);
      setFilesUploadedCount(i);

      if (currentAnalysisCount >= analysisLimit) {
        anyErrorOccurred = true;
        toast({
          title: "Límite de Análisis Alcanzado",
          description: `Has alcanzado tu límite de ${analysisLimit} análisis de CVs para el plan "${planId}". Los archivos restantes no serán procesados.`,
          variant: "destructive",
          duration: 7000,
        });
        setTotalFilesToUpload(i);
        break;
      }

      try {
        const text = await extractTextFromFile(file);
        const resolvedAnalysis = await analyzeCV(text);

        if (user.suscripcion.id && !resolvedAnalysis.extractionError) {
          try {
            const updatedSubscription = await cvService.incrementCvAnalysisCount(user.suscripcion.id);
            currentAnalysisCount = updatedSubscription.cvs_analizados_este_periodo;
            // Considerar actualizar el contexto de usuario aquí si es posible y necesario para UI inmediata
          } catch (incrementError) {
            console.error("useCvUploader: Error al incrementar contador de análisis de CV:", incrementError);
          }
        }
        
        const newCvFile = {
          name: resolvedAnalysis.nombre || file.name,
          originalFile: file, // Mantener el objeto File original por si se necesita
          analysis: resolvedAnalysis,
          uploadedDate: new Date(),
          cv_database_id: null, // Se establecerá después de guardar en BD
          candidate_database_id: null, // Se establecerá después de guardar en BD
        };
        newlyProcessedCvFiles.push(newCvFile);
        CvsProcessedInThisBatch++;
        
        toast({
          title: "CV Procesado",
          description: `${file.name} ha sido analizado. (${i + 1}/${selectedFiles.length})`,
        });

      } catch (error) {
        anyErrorOccurred = true;
        console.error(`Error procesando CV ${file.name}:`, error);
        toast({
          title: `Error al procesar ${file.name}`,
          description: error.message || `No se pudo procesar el archivo.`,
          variant: "destructive",
        });
      }
    }

    if (newlyProcessedCvFiles.length > 0) {
      setCvFiles(prevCvFiles => [...prevCvFiles, ...newlyProcessedCvFiles]);
      if (newlyProcessedCvFiles.length === 1 && selectedFiles.length === 1) {
        // Si solo se subió un archivo, seleccionarlo
        // El índice será el tamaño anterior de cvFiles más 0 (el primer nuevo)
        // Esto requiere que setCvFiles actualice el estado antes de que setSelectedCV lo use.
        // Es más seguro que Dashboard maneje esto después de que setCvFiles se complete.
        // O pasar cvFiles.length como prop al hook.
        // Por ahora, el Dashboard se encargará de la selección.
        setSelectedCV(prevCvFiles => prevCvFiles.length + newlyProcessedCvFiles.length -1); // Esto es problemático, mejor que lo haga el Dashboard
        setCvAnalysis(newlyProcessedCvFiles[0].analysis);
      }
    }
    
    setFilesUploadedCount(totalFilesToUpload);
    setIsBulkProcessing(false);
    setIsProcessing(false);
    setCurrentFileProcessingName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Limpiar el input
    }

    if (!anyErrorOccurred && CvsProcessedInThisBatch > 0) {
      setActiveTab("cvsProcesados");
    } else if (CvsProcessedInThisBatch > 0) {
      setActiveTab("cvsProcesados");
    }
  }, [
    user, 
    toast, 
    fileInputRef, 
    setCvFiles, 
    setSelectedCV, 
    setCvAnalysis, 
    setActiveTab,
    // cvService, extractTextFromFile, analyzeCV, PLAN_CV_ANALYSIS_LIMITS no son reactivas
  ]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files); // Pasar directamente el array de archivos
    }
  }, [handleFileUpload]);

  return {
    isProcessing,
    isBulkProcessing,
    totalFilesToUpload,
    filesUploadedCount,
    currentFileProcessingName,
    handleFileUpload,
    handleDragOver,
    handleDrop,
  };
}