import React, { useState, useRef, useEffect, useCallback } from "react"; // Añadir useEffect y useCallback
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import { Upload, Users, Briefcase, LogOut, FileText, CreditCard, FileUp, Brain } from "lucide-react"; // Añadido FileText, CreditCard, FileUp, Brain
import { useToast } from "@/components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import CVAnalysis from "@/components/CVAnalysis";
import CreateJobForm from "@/components/CreateJobForm.jsx";
import CreateJobAIForm from "@/components/CreateJobAIForm.jsx";
import { cvService } from "@/services/cvService.js";
import UploadCVTab from "@/components/dashboard/UploadCVTab.jsx";
import ProcessedCVsTab from "@/components/dashboard/ProcessedCVsTab.jsx";
import CurrentPlanTab from "@/components/dashboard/CurrentPlanTab.jsx";
import CreateNewJobTab from "@/components/dashboard/CreateNewJobTab.jsx";
import PublishedJobsTab from "@/components/dashboard/PublishedJobsTab.jsx"; // Importar el nuevo componente
import { AIAnalysisTab } from "@/components/dashboard/AIAnalysisTab.jsx"; // Importar la nueva pestaña de Análisis IA
import { useDashboardData } from "@/hooks/useDashboardData.js"; // Importar el nuevo hook
import { useCvUploader } from "@/hooks/useCvUploader.js"; // Importar el hook de subida de CVs

function Dashboard() {
  console.log("Dashboard: Rendering or re-rendering...");
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cargarNuevoCV"); // Pestaña inicial
  const navigate = useNavigate(); // Inicializar useNavigate

  // Usar el hook para obtener datos y funciones de seteo
  const {
    cvFiles,
    setCvFiles,
    jobs,
    setJobs,
    isLoadingCVs,
    isLoadingJobs,
    userSubscription, // Nuevo
    analysisLimit, // Nuevo
    currentAnalysisCount, // Nuevo
    currentJobCount, // Nuevo: Obtener currentJobCount del hook
    effectiveLimits, // Nuevo: Obtener effectiveLimits del hook
  } = useDashboardData();

  // Verificar si la prueba ha expirado después de obtener userSubscription
  const isTrialExpired = userSubscription?.plan_id === 'trial' &&
                         userSubscription?.trial_ends_at &&
                         new Date(userSubscription.trial_ends_at) < new Date();

  // Si la prueba ha expirado, mostrar un mensaje y restringir el contenido
  if (isTrialExpired) {
    console.log("Dashboard: Trial expired, showing upgrade message.");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Tu período de prueba ha expirado</h2>
          <p className="text-slate-700">Para seguir utilizando EmploySmart IA, por favor, activa un plan.</p>
          <Button onClick={() => navigate('/#pricing')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Ver Planes Disponibles
          </Button>
          <Button variant="ghost" onClick={logout} className="text-slate-600 hover:underline">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  console.log("Dashboard: cvFiles from useDashboardData:", cvFiles, "(type:", typeof cvFiles, Array.isArray(cvFiles) ? `length: ${cvFiles.length}` : 'not an array', ")");
  console.log("Dashboard: userSubscription:", userSubscription, "analysisLimit:", analysisLimit, "currentAnalysisCount:", currentAnalysisCount); // Log para verificar
  console.log("Dashboard: jobs from useDashboardData:", jobs, "(type:", typeof jobs, Array.isArray(jobs) ? `length: ${jobs.length}` : 'not an array', ")");

  // Determinar si hay CVs sin guardar (aquellos sin cv_database_id)
  const hasUnsavedCVs = cvFiles.some(cv => !cv.cv_database_id);
  console.log("Dashboard: hasUnsavedCVs:", hasUnsavedCVs);

  const [selectedCV, setSelectedCV] = useState(null);
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const fileInputRef = useRef(null);
  const [editingJob, setEditingJob] = useState(null); // Para almacenar el job que se está editando
  
  console.log("Dashboard states: selectedCV:", selectedCV, "cvAnalysis:", cvAnalysis, "editingJob:", editingJob, "activeTab:", activeTab);

  // Estados para los filtros de CVs
  const [cvFilters, setCvFilters] = useState({
    ageMin: '',
    ageMax: '',
    title: '', // Para nivel_escolarizacion
    experienceKeywords: '',
    skills: '', // String de habilidades separadas por coma
    location: '',
  });

  // La lógica de carga de datos inicial (useEffect, fetchUserCVs, fetchUserJobs)
  // ha sido movida a useDashboardData.js

  const handleSaveSuccess = (cvId, candidateId, updatedAnalysis) => {
    console.log("Dashboard: Entering handleSaveSuccess", { cvId, candidateId, updatedAnalysis });
    // Actualizar el cvFile en el estado cvFiles con los nuevos IDs y el análisis actualizado
    // Esto es importante para que la próxima vez que se seleccione este CV,
    // se sepa que ya existe en la BD y se pueda actualizar en lugar de crear uno nuevo.
    // También asegura que si el análisis fue editado, se refleje en la lista.
    setCvFiles(prevCvFiles => {
      return prevCvFiles.map(cvFile => {
        // Identificar el CV por nombre de archivo original o alguna otra clave única si es necesario
        // Aquí asumimos que el 'updatedAnalysis' tiene el 'textoCompleto' que podemos usar para comparar
        // o si el 'selectedCV' (índice) sigue siendo válido y corresponde al CV guardado.
        // Una forma más robusta sería si 'updatedAnalysis' o 'cvId' permite identificarlo.
        // Por ahora, si el nombre del archivo coincide con el que está seleccionado actualmente.
        if (cvFile.name === cvFiles[selectedCV]?.name) {
          console.log("Dashboard: Updating cvFile in state:", cvFile.name);
          return {
            ...cvFile,
            analysis: updatedAnalysis, // Guardar el análisis posiblemente editado
            cv_database_id: cvId,
            candidate_database_id: candidateId,
          };
        }
        return cvFile;
      });
    });
    // Opcionalmente, podrías querer re-seleccionar el CV para forzar una actualización de 'cvAnalysis'
    // si el objeto 'updatedAnalysis' es diferente en estructura al que ya está en 'cvAnalysis' state.
    // Pero setCvAnalysis(updatedAnalysis) ya debería estar manejado por el flujo normal si es necesario.
  };

  const menuItems = [
    { id: "cargarNuevoCV", label: "Cargar Nuevo CV", icon: Upload },
    { id: "cvsProcesados", label: "CVs Procesados", icon: Users },
    { id: "nuevoPuesto", label: "Nuevo Puesto de trabajo", icon: Briefcase },
    { id: "puestosPublicados", label: "Puestos de trabajo publicados", icon: FileText },
    { id: "analisisIA", label: "Análisis IA Candidatos", icon: Brain }, // Nueva pestaña
    { id: "planActual", label: "Plan actual", icon: CreditCard },
  ];

  // Usar el hook para la lógica de subida de CVs
  const {
    isProcessing,
    isBulkProcessing,
    totalFilesToUpload,
    filesUploadedCount,
    currentFileProcessingName,
    handleFileUpload,
    handleDragOver,
    handleDrop,
  } = useCvUploader({
    fileInputRef,
    setCvFiles,
    setSelectedCV,
    setCvAnalysis,
    setActiveTab,
    currentCvCount: cvFiles.length, // Pasar el número actual de CVs cargados
  });

  // Efecto para seleccionar el CV y mostrar su análisis cuando solo se sube un archivo.
  // Esto se maneja mejor aquí que dentro del hook para evitar problemas de timing con setCvFiles.
  // useEffect(() => {
  //   console.log("Dashboard useEffect [cvFiles, totalFilesToUpload, filesUploadedCount, isBulkProcessing]: cvFiles type:", typeof cvFiles, "cvFiles:", cvFiles);
  //   if (cvFiles && cvFiles.length > 0 && totalFilesToUpload === 1 && filesUploadedCount === 1 && !isBulkProcessing) {
  //     console.log("Dashboard useEffect: Condition met for single file upload post-processing.");
  //     const lastCvIndex = cvFiles.length - 1;
  //     if (cvFiles[lastCvIndex] && cvFiles[lastCvIndex].analysis) {
  //       console.log("Dashboard useEffect: Setting selectedCV and cvAnalysis for the new CV.");
  //       setSelectedCV(lastCvIndex);
  //       setCvAnalysis(cvFiles[lastCvIndex].analysis);
  //     } else {
  //       console.warn("Dashboard useEffect: Last CV or its analysis is missing.", cvFiles[lastCvIndex]);
  //     }
  //   }
  // }, [cvFiles, totalFilesToUpload, filesUploadedCount, isBulkProcessing]);


  const handleCVClick = (index) => {
    console.log("Dashboard: Entering handleCVClick, index:", index, "cvFiles available:", !!cvFiles);
    setSelectedCV(index);
    // cvFiles[index].analysis también podría ser una Promesa si no se resolvió al guardar.
    // Es más seguro re-evaluar o asegurar que se guardó el objeto resuelto.
    // Por ahora, asumimos que el cambio anterior lo resuelve para nuevas subidas.
    // Si se hace clic en un CV antiguo que se subió sin el await, podría seguir siendo una promesa.
    // Una solución más robusta sería asegurar que todos los análisis en cvFiles estén resueltos.
    const clickedCvAnalysis = cvFiles[index].analysis;
    console.log("Dashboard: handleCVClick - analysis object from cvFiles", clickedCvAnalysis);
    if (typeof clickedCvAnalysis.then === 'function') {
        console.warn("Dashboard: ¡El análisis clickeado es una Promesa! Esto no debería suceder con las nuevas subidas.");
        // Opcionalmente, podrías intentar resolverla aquí si es una promesa,
        // pero idealmente debería estar resuelta al guardarse.
        clickedCvAnalysis.then(resolved => {
            console.log("Dashboard: handleCVClick - Promesa resuelta al hacer clic", resolved);
            setCvAnalysis(resolved);
        }).catch(err => {
            console.error("Dashboard: Error al resolver promesa en handleCVClick", err);
            // Manejar el error, quizás mostrar un toast
        });
    } else {
        setCvAnalysis(clickedCvAnalysis);
    }
  };

  const handleAddJob = () => {
    console.log("Dashboard: Entering handleAddJob");
    const newJob = {
      id: Date.now(),
      title: "Nuevo Puesto Ejemplo",
      description: "Descripción detallada del nuevo puesto de trabajo...",
    };
    setJobs([...jobs, newJob]);
    toast({
      title: "Puesto añadido",
      description: "Se ha creado un nuevo puesto de trabajo.",
    });
  };

  const handleDeleteCV = async (cvFileToDelete) => {
    console.log("Dashboard: Entering handleDeleteCV, cvFileToDelete:", cvFileToDelete);
    const cvDatabaseIdToDelete = cvFileToDelete?.cv_database_id;

    if (!cvDatabaseIdToDelete) {
      console.warn("Dashboard: Intento de eliminar CV sin ID de BD. No se puede eliminar de Supabase:", cvFileToDelete);
      toast({ title: "Error", description: "No se proporcionó ID de base de datos para eliminar el CV. No se puede eliminar de Supabase.", variant: "destructive" });
      return;
    }

    console.log("Dashboard: Intentando eliminar CV con ID de BD:", cvDatabaseIdToDelete);
    try {
      await cvService.deleteCV(cvDatabaseIdToDelete);
      toast({ title: "CV Eliminado", description: "El CV y los datos asociados han sido eliminados." });

      const updatedCvFiles = cvFiles.filter(cv => cv.cv_database_id !== cvDatabaseIdToDelete);
      setCvFiles(updatedCvFiles);
      
      const currentSelectedCv = cvFiles[selectedCV];
      if (currentSelectedCv && currentSelectedCv.cv_database_id === cvDatabaseIdToDelete) {
        setSelectedCV(null);
        setCvAnalysis(null);
      } else if (selectedCV !== null) {
        if (selectedCV >= updatedCvFiles.length) {
            setSelectedCV(null);
            setCvAnalysis(null);
        }
      }
    } catch (error) {
      console.error("Dashboard: Error al eliminar CV:", error);
      toast({ title: "Error al Eliminar", description: `No se pudo eliminar el CV: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDeleteJob = async (jobId) => {
    console.log("Dashboard: Entering handleDeleteJob, jobId:", jobId);
    if (!jobId) {
      toast({ title: "Error", description: "ID del puesto no proporcionado.", variant: "destructive" });
      return;
    }
    if (!window.confirm("¿Estás seguro de que quieres eliminar este puesto de trabajo?")) {
      return;
    }
    try {
      await cvService.deleteJobPost(jobId);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({ title: "Puesto Eliminado", description: "El puesto de trabajo ha sido eliminado." });
    } catch (error) {
      console.error("Dashboard: Error eliminando puesto:", error);
      toast({ title: "Error al Eliminar", description: `No se pudo eliminar el puesto: ${error.message}`, variant: "destructive" });
    }
  };

  const handleEditJob = (jobToEdit) => {
    console.log("Dashboard: Entering handleEditJob, jobToEdit:", jobToEdit);
    setEditingJob(jobToEdit); // Guardar los datos del job a editar
    setActiveTab("nuevoPuesto"); // Cambiar a la pestaña de creación/edición
  };

  const handleJobPublishedOrUpdated = (job) => {
    console.log("Dashboard: handleJobPublishedOrUpdated called with job:", job); // Log detallado
    if (editingJob) { // Si estábamos editando
      setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? job : j));
      toast({ title: "Puesto Actualizado", description: `${job.title} ha sido actualizado.` });
    } else { // Si era un nuevo puesto
      setJobs(prevJobs => [job, ...prevJobs]);
      // El toast de "Puesto Publicado" ya lo maneja CreateNewJobTab
    }
    setEditingJob(null); // Limpiar el estado de edición
    // setActiveTab("puestosPublicados"); // CreateNewJobTab ya hace esto
  };


  // Función para guardar todos los CVs que aún no tienen cv_database_id
  const handleSaveAllCVs = async () => {
    console.log("Dashboard: Entering handleSaveAllCVs");
    const unsavedCVs = cvFiles.filter(cv => !cv.cv_database_id);

    if (unsavedCVs.length === 0) {
      toast({
        title: "No hay CVs sin guardar",
        description: "Todos los CVs ya están en la base de datos.",
      });
      return;
    }

    toast({
      title: "Guardando CVs...",
      description: `Iniciando el guardado de ${unsavedCVs.length} CVs.`,
    });

    let savedCount = 0;
    const updatedCvFiles = [...cvFiles]; // Copia para actualizar el estado al final

    for (const cvFile of unsavedCVs) {
      try {
        // Asegurarse de que el análisis esté resuelto si es una promesa
        const analysis = typeof cvFile.analysis.then === 'function'
          ? await cvFile.analysis
          : cvFile.analysis;

        const result = await cvService.saveCV({
          fileName: cvFile.name,
          fileContent: cvFile.text, // Asumiendo que 'text' es el contenido completo
          analysis: analysis,
          userId: user?.id,
        });

        if (result && result.data) {
          savedCount++;
          // Encontrar el índice del CV guardado en la copia y actualizarlo
          const indexToUpdate = updatedCvFiles.findIndex(cv => cv.name === cvFile.name && !cv.cv_database_id);
          if (indexToUpdate !== -1) {
            updatedCvFiles[indexToUpdate] = {
              ...updatedCvFiles[indexToUpdate],
              cv_database_id: result.data.cvId,
              candidate_database_id: result.data.candidateId,
              analysis: analysis, // Asegurar que el análisis resuelto esté en el estado
            };
          }
        } else {
           console.error("Dashboard: Error saving CV, no data returned:", cvFile.name, result);
           toast({
             title: "Error al guardar un CV",
             description: `No se recibieron datos al intentar guardar ${cvFile.name}.`,
             variant: "destructive",
           });
        }

      } catch (error) {
        console.error("Dashboard: Error al guardar CV:", cvFile.name, error);
        toast({
          title: "Error al guardar un CV",
          description: `No se pudo guardar ${cvFile.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    // Actualizar el estado principal de cvFiles con los CVs guardados
    setCvFiles(updatedCvFiles);

    if (savedCount > 0) {
      toast({
        title: "Guardado Completo",
        description: `Se guardaron ${savedCount} de ${unsavedCVs.length} CVs sin guardar.`,
      });
    } else {
       toast({
         title: "Guardado Finalizado",
         description: "No se pudo guardar ningún CV.",
         variant: "destructive",
       });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Superior */}
      <header className="bg-slate-900 text-white p-3 shadow-md flex justify-between items-center">
        <div className="text-lg font-semibold">
          {/* Podría ir un logo pequeño o HR Intelligence aquí si se prefiere */}
        </div>
        <div className="flex items-center space-x-4">
          {user?.company && (
            <span className="text-sm font-medium hidden sm:inline">Empresa: {user.company}</span>
          )}
          <Button
            variant="ghost"
            className="text-white hover:bg-slate-700 px-3 py-1.5 text-sm"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 md:w-72 bg-white p-4 shadow-lg space-y-3 border-r border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-5 px-2">HR Intelligence</h1>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 p-2.5 rounded-md text-left text-sm font-medium transition-colors
                  ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-gray-100 hover:text-slate-800"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {console.log("Dashboard: Rendering main content area. Active tab:", activeTab)}
          {activeTab === "cargarNuevoCV" && (() => {
            console.log("Dashboard: Rendering UploadCVTab");
            return (
            <UploadCVTab
              handleFileUpload={handleFileUpload}
              fileInputRef={fileInputRef}
              isBulkProcessing={isBulkProcessing}
              isProcessing={isProcessing}
              totalFilesToUpload={totalFilesToUpload}
              filesUploadedCount={filesUploadedCount}
              currentFileProcessingName={currentFileProcessingName}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              userSubscription={userSubscription} // Pasar la suscripción
              analysisLimit={analysisLimit} // Pasar el límite
              currentAnalysisCount={currentAnalysisCount} // Pasar el contador
              effectiveLimits={effectiveLimits} // Nuevo: Pasar effectiveLimits
            />
            );
          })()}

          {activeTab === "cvsProcesados" && (() => {
            console.log("Dashboard: Rendering ProcessedCVsTab, cvFiles:", cvFiles, "selectedCV:", selectedCV);
            return (
            <ProcessedCVsTab
              cvFiles={cvFiles}
              selectedCV={selectedCV}
              handleCVClick={handleCVClick}
              cvAnalysis={cvAnalysis}
              isLoadingCVs={isLoadingCVs}
              isProcessing={isProcessing}
              userId={user?.id}
              onSaveSuccess={handleSaveSuccess}
              onDeleteCV={handleDeleteCV}
              cvFilters={cvFilters}
              onCvFilterChange={setCvFilters}
              hasUnsavedCVs={hasUnsavedCVs} // Pasar la nueva prop
              onSaveAllCVs={handleSaveAllCVs} // Pasar la nueva función
            />
            );
          })()}

          {activeTab === "nuevoPuesto" && (() => {
            console.log("Dashboard: Rendering CreateNewJobTab, jobs:", jobs);
            return (
            <CreateNewJobTab
              setActiveTab={setActiveTab}
              currentJobsCount={currentJobCount} // Usar currentJobCount de la suscripción
              onJobPublishedOrUpdated={handleJobPublishedOrUpdated}
              editingJob={editingJob}
              setEditingJob={setEditingJob}
              effectiveLimits={effectiveLimits} // Pasar effectiveLimits
            />
            );
          })()}

          {activeTab === "puestosPublicados" && (() => {
            console.log("Dashboard: Rendering PublishedJobsTab, jobs:", jobs);
            return (
            <PublishedJobsTab
              jobs={jobs}
              isLoadingJobs={isLoadingJobs}
              onDeleteJob={handleDeleteJob}
              onEditJob={handleEditJob}
              setActiveTab={setActiveTab}
              currentJobCount={currentJobCount}
              effectiveLimits={effectiveLimits}
            />
            );
          })()}

          {activeTab === "analisisIA" && (() => {
            console.log("Dashboard: Rendering AIAnalysisTab");
            return (
            <AIAnalysisTab
              jobs={jobs}
              isLoadingJobs={isLoadingJobs}
              cvFilesFromDashboard={cvFiles}
              isLoadingCandidates={isLoadingCVs}
            />
            );
          })()}

          {activeTab === "planActual" && (() => {
            console.log("Dashboard: Rendering CurrentPlanTab");
            return (
            <CurrentPlanTab />
            );
          })()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
