import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import { cvService } from "@/services/cvService.js";
import { PLAN_CV_ANALYSIS_LIMITS, APP_PLANS } from '@/config/plans'; // Importar los límites y APP_PLANS

export function useCvUploader({
  fileInputRef, // Ref para limpiar el input de archivo
  currentCvCount, // Nuevo: número actual de CVs cargados
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

    console.log("useCvUploader: handleFileUpload - setIsBulkProcessing(true)");
    setIsBulkProcessing(true);
    console.log("useCvUploader: handleFileUpload - setIsProcessing(true)");
    setIsProcessing(true);
    console.log("useCvUploader: handleFileUpload - setTotalFilesToUpload(selectedFiles.length)");
    setTotalFilesToUpload(selectedFiles.length);
    console.log("useCvUploader: handleFileUpload - setFilesUploadedCount(0)");
    setFilesUploadedCount(0);
    console.log("useCvUploader: handleFileUpload - setCurrentFileProcessingName('')");
    setCurrentFileProcessingName("");
    let anyErrorOccurred = false;
    let CvsProcessedInThisBatch = 0;
    const newlyProcessedCvFiles = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      console.log("useCvUploader: handleFileUpload - setCurrentFileProcessingName(file.name)", file.name);
      setCurrentFileProcessingName(file.name);
      console.log("useCvUploader: handleFileUpload - setFilesUploadedCount(i)", i);
      setFilesUploadedCount(i);

      const planDetails = APP_PLANS[planId];
      const isOneTimePlan = planDetails?.type === 'one-time';

      let limitExceeded = false;
      let limitDescription = "";

      if (isOneTimePlan) {
        // Para planes one-time, verificar si el total de CVs (actual + nuevos) excede el límite total
        if (currentCvCount + selectedFiles.length > analysisLimit) {
           limitExceeded = true;
           limitDescription = `Has alcanzado tu límite total de ${analysisLimit} análisis de CVs para el plan "${planDetails.name}".`;
        }
      } else {
        // Para planes recurrentes, verificar si el contador del período excede el límite del período
        if (currentAnalysisCount >= analysisLimit) {
          limitExceeded = true;
          limitDescription = `Has alcanzado tu límite mensual de ${analysisLimit} análisis de CVs para el plan "${planDetails.name}".`;
        }
      }

      if (limitExceeded) {
        anyErrorOccurred = true;
        toast({
          title: "Límite de Análisis Alcanzado",
          description: `${limitDescription} Por favor, contacta a ventas si necesitas más capacidad.`,
          variant: "destructive",
          duration: 7000,
        });
        setTotalFilesToUpload(i); // Detener el procesamiento de archivos restantes
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
      console.log("useCvUploader: Calling setCvFiles with newlyProcessedCvFiles:", newlyProcessedCvFiles);
      setCvFiles(prevCvFiles => {
        const updated = [...(prevCvFiles || []), ...newlyProcessedCvFiles]; // Asegurar que prevCvFiles es array
        console.log("useCvUploader: setCvFiles updater, prevCvFiles:", prevCvFiles, "updated:", updated);
        return updated;
      });

      if (newlyProcessedCvFiles.length === 1 && selectedFiles.length === 1) {
        console.log("useCvUploader: Single file processed. Attempting to set selectedCV and cvAnalysis.");
        // El cálculo del índice para setSelectedCV aquí es propenso a errores de timing
        // ya que setCvFiles es asíncrono. El Dashboard tiene un useEffect para esto.
        // Sin embargo, para depurar, podemos loguear lo que se intentaría pasar.
        // const newIndex = (cvFiles?.length || 0) + newlyProcessedCvFiles.length -1; // cvFiles aquí es el del closure, no el actualizado
        // console.log("useCvUploader: Would call setSelectedCV with index (approx):", newIndex);
        // setSelectedCV(newIndex); // Comentado, el Dashboard lo maneja
        
        console.log("useCvUploader: Calling setCvAnalysis with:", newlyProcessedCvFiles[0]?.analysis);
        setCvAnalysis(newlyProcessedCvFiles[0]?.analysis);
      }
    }
    
    console.log("useCvUploader: Calling setFilesUploadedCount with:", totalFilesToUpload);
    setFilesUploadedCount(totalFilesToUpload);
    console.log("useCvUploader: handleFileUpload - setIsBulkProcessing(false)");
    setIsBulkProcessing(false);
    console.log("useCvUploader: handleFileUpload - setIsProcessing(false)");
    setIsProcessing(false);
    console.log("useCvUploader: handleFileUpload - setCurrentFileProcessingName('')");
    setCurrentFileProcessingName("");

    if (fileInputRef.current) {
      console.log("useCvUploader: Clearing file input.");
      fileInputRef.current.value = "";
    }

    if (!anyErrorOccurred && CvsProcessedInThisBatch > 0) {
      console.log("useCvUploader: All successful, setting activeTab to 'cvsProcesados'");
      setActiveTab("cvsProcesados");
    } else if (CvsProcessedInThisBatch > 0) {
      console.log("useCvUploader: Some processed with errors/limit, setting activeTab to 'cvsProcesados'");
      setActiveTab("cvsProcesados");
    } else {
      console.log("useCvUploader: No CVs processed in this batch.");
    }
  }, [
    user,
    toast,
    fileInputRef,
    setCvFiles,
    // setSelectedCV, // Comentado para que Dashboard lo maneje vía useEffect
    setCvAnalysis,
    setActiveTab,
    // No incluir setSelectedCV aquí si el Dashboard lo maneja para evitar dependencias conflictivas
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