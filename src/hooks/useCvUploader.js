import { useState, useCallback, useEffect } from 'react'; // Añadir useEffect
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
  refreshDashboardData, // Nueva prop: función para refrescar los datos del dashboard
  onUploadComplete, // Nueva prop: callback para cuando la carga y procesamiento de CVs termina
  // cvFiles prop es necesario para calcular el índice del nuevo CV si se selecciona
  // y para evitar pasar el estado completo si solo se necesita la longitud.
  // Podríamos pasar cvFiles.length directamente si esa es la única necesidad.
  // Por ahora, pasaremos la función setCvFiles y el componente Dashboard manejará la lógica de añadir.
}) {
  const { user } = useAuth(); // Ya no necesitamos refreshUser directamente aquí
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [filesUploadedCount, setFilesUploadedCount] = useState(0);
  const [currentFileProcessingName, setCurrentFileProcessingName] = useState("");
  const [optimisticCvCount, setOptimisticCvCount] = useState(currentCvCount); // Nuevo estado optimista
  const [processingFiles, setProcessingFiles] = useState([]); // Nuevo estado para el progreso individual

  // Sincronizar optimisticCvCount con currentCvCount cuando este último cambie (después de refreshUser)
  useEffect(() => {
    if (currentCvCount !== undefined && optimisticCvCount !== currentCvCount) {
      console.debug("useCvUploader: Sincronizando optimisticCvCount con currentCvCount de DB:", currentCvCount);
      setOptimisticCvCount(currentCvCount);
    }
  }, [currentCvCount, optimisticCvCount]);

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

    // Inicializar el estado de processingFiles
    setProcessingFiles(selectedFiles.map(file => ({
      id: file.name + Date.now() + Math.random(), // ID único temporal
      name: file.name,
      status: 'pending', // 'pending', 'extracting', 'analyzing', 'saving', 'completed', 'error', 'duplicate'
      progress: 0, // 0-100
      file: file, // Mantener referencia al objeto File original
      analysisResult: null,
      databaseId: null,
    })));

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      // Obtener el ID temporal del archivo actual de la lista inicializada
      // Asegurarse de que processingFiles[i] exista antes de acceder a .id
      const fileId = processingFiles[i] ? processingFiles[i].id : null;

      // Actualizar el nombre del archivo que se está procesando actualmente
      setCurrentFileProcessingName(file.name);
      setFilesUploadedCount(i);

      // Actualizar el estado del archivo individual a 'extracting'
      setProcessingFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'extracting', progress: 25 } : f
      ));

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

        let text = await extractTextFromFile(file);
        setProcessingFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'analyzing', progress: 50 } : f
        ));

        let resolvedAnalysis = await analyzeCV(text);
        setProcessingFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'saving', progress: 75 } : f
        ));

        if (resolvedAnalysis.isPoorAnalysis && file.type === 'application/pdf') {
          console.warn(`Análisis inicial de CV ${file.name} es pobre. Reintentando extracción con OCR forzado.`);
          const ocrText = await extractTextFromFile(file, true);
          if (ocrText && typeof ocrText === 'string' && ocrText.trim().length > 10) {
            resolvedAnalysis = await analyzeCV(ocrText);
            if (resolvedAnalysis.isPoorAnalysis) {
              console.error(`Análisis de CV ${file.name} sigue siendo pobre incluso después de OCR.`);
              throw new Error("El análisis del CV es deficiente incluso con OCR. El documento podría ser ilegible.");
            }
          } else if (ocrText && ocrText.error) {
            throw new Error(`Error en la extracción OCR forzada: ${ocrText.message}`);
          } else {
            throw new Error("La extracción OCR forzada no devolvió texto útil.");
          }
        }

        // Paso 3: Guardar CV y Candidato
        const result = await cvService.uploadCV(file, user.id, resolvedAnalysis, user.suscripcion);

        if (result?.isDuplicate) {
          toast({
            title: "CV Duplicado",
            description: `El CV "${file.name}" ya existe en tu base de datos. No se guardó una nueva entrada.`,
            variant: "default",
            duration: 5000,
          });
          setProcessingFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, status: 'duplicate', progress: 100, analysisResult: resolvedAnalysis } : f
          ));
        } else if (result && !result.error) {
          if (refreshDashboardData) { // Usar refreshDashboardData
            console.debug("useCvUploader: CV guardado y contador incrementado. Refrescando datos del dashboard...");
            await refreshDashboardData(); // Llamar a la función de refresco del dashboard
          }

          const newCvFile = {
            name: resolvedAnalysis.nombre || file.name,
            originalFile: file, // Mantener el objeto File original por si se necesita
            analysis: resolvedAnalysis,
            uploadedDate: new Date(),
            cv_database_id: result?.cv?.id || null,
            candidate_database_id: result?.candidate?.id || null,
          };
          newlyProcessedCvFiles.push(newCvFile);
          CvsProcessedInThisBatch++;
          setOptimisticCvCount(prevCount => prevCount + 1);

          setProcessingFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, status: 'completed', progress: 100, analysisResult: resolvedAnalysis, databaseId: result?.cv?.id } : f
          ));

          toast({
            title: "CV Procesado",
            description: `${file.name} ha sido analizado. (${i + 1}/${selectedFiles.length})`,
          });
        } else {
          // Manejar errores de guardado que no son duplicados
          anyErrorOccurred = true;
          console.error(`Error procesando CV ${file.name}:`, result?.message || "Error desconocido al guardar CV.");
          toast({
            title: `Error al procesar ${file.name}`,
            description: result?.message || `No se pudo procesar el archivo.`,
            variant: "destructive",
          });
          setProcessingFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, status: 'error', progress: 100, analysisResult: resolvedAnalysis } : f
          ));
        }
      } catch (error) {
        anyErrorOccurred = true;
        console.error(`Excepción al procesar CV ${file.name}:`, error);
        toast({
          title: `Error al procesar ${file.name}`,
          description: error.message || `Ocurrió un error inesperado.`,
          variant: "destructive",
        });
        setProcessingFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'error', progress: 100, analysisResult: { error: true, message: error.message } } : f
        ));
      }
    }
    // Asegurarse de que todos los archivos que no se procesaron (por límite, etc.) se marquen como error o cancelados
    setProcessingFiles(prev => prev.map(f => {
      // Si el archivo aún está en 'pending' y no tiene un resultado de análisis,
      // significa que no se procesó en absoluto (ej. por límite de plan o interrupción temprana).
      if (f.status === 'pending' && !f.analysisResult) {
        return { ...f, status: 'skipped', progress: 0 }; // Nuevo estado 'skipped'
      }
      return f;
    }));

    if (newlyProcessedCvFiles.length > 0) {
      console.log("useCvUploader: Calling setCvFiles with newlyProcessedCvFiles:", newlyProcessedCvFiles);
      setCvFiles(prevCvFiles => {
        const updated = [...(prevCvFiles || []), ...newlyProcessedCvFiles]; // Asegurar que prevCvFiles es array
        console.log("useCvUploader: setCvFiles updater, prevCvFiles:", prevCvFiles, "updated:", updated);
        return updated;
      });

      if (newlyProcessedCvFiles.length === 1 && selectedFiles.length === 1) {
        console.log("useCvUploader: Single file processed. Attempting to set selectedCV and cvAnalysis.");
        if (setCvAnalysis && newlyProcessedCvFiles[0]?.analysis) { // Añadir verificación
          setCvAnalysis(newlyProcessedCvFiles[0]?.analysis);
        }
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

    // Llamar a onUploadComplete con todos los archivos procesados, incluyendo duplicados y errores
    if (onUploadComplete) {
      onUploadComplete(processingFiles);
    }

    if (CvsProcessedInThisBatch > 0) {
      if (!anyErrorOccurred) {
        toast({
          title: "Carga de CVs Exitosa",
          description: `${CvsProcessedInThisBatch} CV(s) procesado(s) y guardado(s) correctamente.`,
          variant: "success",
          duration: 5000,
        });
        if (!onUploadComplete) { // Only switch tab if no specific onUploadComplete handler is provided
          console.log("useCvUploader: All successful, setting activeTab to 'cvsProcesados'");
          setActiveTab("cvsProcesados");
        }
      } else {
        toast({
          title: "Carga de CVs Completada con Advertencias",
          description: `Se procesaron ${CvsProcessedInThisBatch} CV(s), pero algunos tuvieron errores o eran duplicados.`,
          variant: "warning",
          duration: 7000,
        });
        if (!onUploadComplete) { // Only switch tab if no specific onUploadComplete handler is provided
          console.log("useCvUploader: Some processed with errors/limit, setting activeTab to 'cvsProcesados'");
          setActiveTab("cvsProcesados");
        }
      }
    } else {
      console.log("useCvUploader: No CVs processed in this batch.");
      if (anyErrorOccurred) {
        toast({
          title: "Error en la Carga de CVs",
          description: "No se pudo procesar ningún CV debido a errores o límites alcanzados.",
          variant: "destructive",
          duration: 7000,
        });
      }
    }
  }, [
    user,
    toast,
    fileInputRef,
    setCvFiles,
    setCvAnalysis,
    setActiveTab,
    refreshDashboardData,
    processingFiles, // Añadir processingFiles a las dependencias
    onUploadComplete, // Añadir onUploadComplete a las dependencias
    currentCvCount, // Añadir currentCvCount a las dependencias
    analysisLimit, // Añadir analysisLimit a las dependencias
    planId, // Añadir planId a las dependencias
    APP_PLANS, // Añadir APP_PLANS a las dependencias
    currentAnalysisCount, // Añadir currentAnalysisCount a las dependencias
    extractTextFromFile, // Añadir extractTextFromFile a las dependencias
    analyzeCV, // Añadir analyzeCV a las dependencias
    cvService, // Añadir cvService a las dependencias
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
    optimisticCvCount,
    processingFiles, // Devolver el nuevo estado
  };
}