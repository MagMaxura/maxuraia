import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom"; // Importar useNavigate y useParams
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
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cargarNuevoCV");
  const navigate = useNavigate();
  const { candidateId: urlCandidateId } = useParams(); // Obtener candidateId de la URL

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
    matchLimit, // Nuevo: Límite de macheos
    currentMatchCount, // Nuevo: Contador de macheos
    isBonusPlanActive, // Añadir
    bonusCvUsed, // Añadir
    bonusJobUsed, // Añadir
    bonusMatchUsed, // Añadir
    bonusCvTotal, // Añadir
    bonusJobTotal, // Añadir
    bonusMatchTotal, // Añadir
    isBasePlanActive, // Nuevo
    basePlan, // Nuevo
  } = useDashboardData();

  // Verificar si la prueba ha expirado después de obtener userSubscription
  const isTrialExpired = userSubscription?.plan_id === 'trial' &&
                         userSubscription?.trial_ends_at &&
                         new Date(userSubscription.trial_ends_at) < new Date();

  // Si la prueba ha expirado, mostrar un mensaje y restringir el contenido
  if (isTrialExpired) {
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


  // Determinar si hay CVs sin guardar (aquellos sin cv_database_id)
  const hasUnsavedCVs = cvFiles.some(cv => !cv.cv_database_id);

  const [selectedCV, setSelectedCV] = useState(null);
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const fileInputRef = useRef(null);
  const [editingJob, setEditingJob] = useState(null); // Para almacenar el job que se está editando
  

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
 
  // Efecto para manejar la selección de CV desde la URL o al cargar la lista
  useEffect(() => {
    if (urlCandidateId && cvFiles.length > 0) {
      const cvIndex = cvFiles.findIndex(cv => cv.candidate_database_id === urlCandidateId);
      if (cvIndex !== -1 && selectedCV !== cvIndex) {
        setSelectedCV(cvIndex);
        setCvAnalysis(cvFiles[cvIndex].analysis);
        setActiveTab("cvsProcesados"); // Asegurarse de que la pestaña correcta esté activa
      }
    } else if (cvFiles.length > 0 && selectedCV === null && cvAnalysis === null) {
      // Lógica existente para seleccionar el CV más reciente si no hay uno seleccionado
      let latestCvIndex = 0;
      if (cvFiles.every(cv => cv.uploadedDate)) {
        latestCvIndex = cvFiles.reduce((latestIndex, currentCv, currentIndex, arr) => {
          return new Date(currentCv.uploadedDate) > new Date(arr[latestIndex].uploadedDate) ? currentIndex : latestIndex;
        }, 0);
      } else {
        latestCvIndex = cvFiles.length - 1;
      }
      setSelectedCV(latestCvIndex);
      setCvAnalysis(cvFiles[latestCvIndex].analysis);
    }
  }, [urlCandidateId, cvFiles, selectedCV, cvAnalysis, setActiveTab]);

   const handleSaveSuccess = (cvId, candidateId, updatedAnalysis) => {
    setCvFiles(prevCvFiles => {
      return prevCvFiles.map((cvFile, index) => {
        const isCurrentlySelected = index === selectedCV;
        const isMatchingSavedCv = (cvFile.cv_database_id && cvFile.cv_database_id === cvId) ||
                                   (cvFile.candidate_database_id && cvFile.candidate_database_id === candidateId);

        if (isCurrentlySelected || isMatchingSavedCv) {
          return {
            ...cvFile,
            analysis: updatedAnalysis,
            cv_database_id: cvId,
            candidate_database_id: candidateId,
          };
        }
        return cvFile;
      });
    });
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
    optimisticCvCount, // Recibir el contador optimista
  } = useCvUploader({
    fileInputRef,
    setCvFiles,
    setSelectedCV,
    setCvAnalysis,
    setActiveTab,
    currentCvCount: currentAnalysisCount, // Pasar currentAnalysisCount para sincronización
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
    setSelectedCV(index);
    const clickedCvAnalysis = cvFiles[index].analysis;

    // Actualizar la URL para reflejar el CV seleccionado
    const candidateId = cvFiles[index]?.candidate_database_id;
    if (candidateId) {
      navigate(`/dashboard/cv-analysis/${candidateId}`);
    }

    if (typeof clickedCvAnalysis.then === 'function') {
        console.warn("Dashboard: ¡El análisis clickeado es una Promesa! Esto no debería suceder con las nuevas subidas.");
        clickedCvAnalysis.then(resolved => {
            setCvAnalysis(resolved);
        }).catch(err => {
            console.error("Dashboard: Error al resolver promesa en handleCVClick", err);
        });
    } else {
        setCvAnalysis(clickedCvAnalysis);
    }
  };

  const handleAddJob = () => {
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
    const cvDatabaseIdToDelete = cvFileToDelete?.cv_database_id;
    const candidateDatabaseIdToDelete = cvFileToDelete?.candidate_database_id; // Declaración movida aquí

    if (!cvDatabaseIdToDelete && !candidateDatabaseIdToDelete) {
      console.warn("Dashboard: Intento de eliminar CV sin ID de BD o ID de Candidato. No se puede eliminar de Supabase:", cvFileToDelete);
      toast({ title: "Error", description: "No se proporcionó ID de base de datos de CV ni de Candidato para eliminar. No se puede eliminar de Supabase.", variant: "destructive" });
      return;
    }

    try {
      // Llamar a cvService.deleteCV con el ID de CV o el ID de Candidato
      await cvService.deleteCV(cvDatabaseIdToDelete, candidateDatabaseIdToDelete);
      toast({ title: "CV Eliminado", description: "El CV y los datos asociados han sido eliminados." });

      // Actualizar el estado local de cvFiles
      const updatedCvFiles = cvFiles.filter(cv =>
        (cvDatabaseIdToDelete && cv.cv_database_id !== cvDatabaseIdToDelete) ||
        (candidateDatabaseIdToDelete && cv.candidate_database_id !== candidateDatabaseIdToDelete)
      );
      setCvFiles(updatedCvFiles);
      
      // Ajustar selectedCV si el CV/Candidato eliminado era el seleccionado
      const currentSelectedCv = cvFiles[selectedCV];
      if (currentSelectedCv &&
          ((cvDatabaseIdToDelete && currentSelectedCv.cv_database_id === cvDatabaseIdToDelete) ||
           (candidateDatabaseIdToDelete && currentSelectedCv.candidate_database_id === candidateDatabaseIdToDelete))) {
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
    setEditingJob(jobToEdit); // Guardar los datos del job a editar
    setActiveTab("nuevoPuesto"); // Cambiar a la pestaña de creación/edición
  };

  const handleJobPublishedOrUpdated = (job) => {
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
          {activeTab === "cargarNuevoCV" && (() => {
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
              optimisticCurrentAnalysisCount={optimisticCvCount} // Pasar el contador optimista
              effectiveLimits={effectiveLimits} // Nuevo: Pasar effectiveLimits
              isBonusPlanActive={isBonusPlanActive}
              bonusCvUsed={bonusCvUsed}
              bonusCvTotal={bonusCvTotal}
              bonusJobUsed={bonusJobUsed}
              bonusJobTotal={bonusJobTotal}
              bonusMatchUsed={bonusMatchUsed}
              bonusMatchTotal={bonusMatchTotal}
              isBasePlanActive={isBasePlanActive} // Nuevo
              basePlan={basePlan} // Nuevo
              onCvUploadSuccess={refreshUser} // Pasar refreshUser como callback
            />
            );
          })()}

          {activeTab === "cvsProcesados" && (() => {
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
              isCvSaved={!!cvFiles[selectedCV]?.cv_database_id || !!cvFiles[selectedCV]?.candidate_database_id} // Determinar si el CV ya está guardado
            />
            );
          })()}

          {activeTab === "nuevoPuesto" && (() => {
            return (
            <CreateNewJobTab
              setActiveTab={setActiveTab}
              currentJobsCount={currentJobCount} // Usar currentJobCount de la suscripción
              onJobPublishedOrUpdated={handleJobPublishedOrUpdated}
              editingJob={editingJob}
              setEditingJob={setEditingJob}
              effectiveLimits={effectiveLimits} // Pasar effectiveLimits
              isBonusPlanActive={isBonusPlanActive}
              bonusJobUsed={bonusJobUsed}
              bonusJobTotal={bonusJobTotal}
              isBasePlanActive={isBasePlanActive} // Nuevo
              basePlan={basePlan} // Nuevo
            />
            );
          })()}

          {activeTab === "puestosPublicados" && (() => {
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
            return (
            <AIAnalysisTab
              jobs={jobs}
              recruiterId={user?.id}
              matchLimit={matchLimit}
              currentMatchCount={currentMatchCount}
              cvFilesFromDashboard={cvFiles}
              isLoadingCandidates={isLoadingCVs}
              isLoadingJobs={isLoadingJobs}
            />
            );
          })()}

          {activeTab === "planActual" && (() => {
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
