import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, Routes, Route, Outlet, useLocation, useParams } from "react-router-dom";
import { Upload, Users, Briefcase, LogOut, FileText, CreditCard, FileUp, Brain } from "lucide-react";
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
import PublishedJobsTab from "@/components/dashboard/PublishedJobsTab.jsx";
import { AIAnalysisTab } from "@/components/dashboard/AIAnalysisTab.jsx";
import { useDashboardData } from "@/hooks/useDashboardData.js";
import { useCvUploader } from "@/hooks/useCvUploader.js";

function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { candidateId } = useParams(); // Obtener candidateId de la URL

  const {
    cvFiles,
    setCvFiles,
    jobs,
    setJobs,
    isLoadingCVs,
    isLoadingJobs,
    userSubscription,
    analysisLimit,
    currentAnalysisCount,
    currentJobCount,
    effectiveLimits,
    matchLimit,
    currentMatchCount,
    isBonusPlanActive,
    bonusCvUsed,
    bonusJobUsed,
    bonusMatchUsed,
    bonusCvTotal,
    bonusJobTotal,
    bonusMatchTotal,
    isBasePlanActive,
    basePlan,
  } = useDashboardData();

  const isTrialExpired = userSubscription?.plan_id === 'trial' &&
                         userSubscription?.trial_ends_at &&
                         new Date(userSubscription.trial_ends_at) < new Date();

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

  const hasUnsavedCVs = cvFiles.some(cv => !cv.cv_database_id);

  const [selectedCV, setSelectedCV] = useState(null);
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const fileInputRef = useRef(null);
  const [editingJob, setEditingJob] = useState(null);

  const [cvFilters, setCvFilters] = useState({
    ageMin: '',
    ageMax: '',
    title: '',
    experienceKeywords: '',
    skills: '',
    location: '',
  });

  // Efecto para manejar la selección del CV más reciente al cargar la lista o al cambiar el candidateId de la URL
  useEffect(() => {
    if (candidateId) {
      const foundIndex = cvFiles.findIndex(cv => cv.candidate_database_id === candidateId);
      if (foundIndex !== -1) {
        setSelectedCV(foundIndex);
        setCvAnalysis(cvFiles[foundIndex].analysis);
      } else {
        // Si el candidato no se encuentra, quizás navegar a la lista de CVs o mostrar un mensaje de error
        navigate("/dashboard/cvs-procesados"); // Navegar a la lista si el candidato no se encuentra
      }
    } else if (cvFiles.length > 0 && selectedCV === null && cvAnalysis === null && location.pathname === "/dashboard/cvs-procesados") {
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
  }, [cvFiles, selectedCV, cvAnalysis, candidateId, navigate, location.pathname]);

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
    { id: "cargarNuevoCV", label: "Cargar Nuevo CV", icon: Upload, path: "/dashboard" },
    { id: "cvsProcesados", label: "CVs Procesados", icon: Users, path: "/dashboard/cvs-procesados" },
    { id: "nuevoPuesto", label: "Nuevo Puesto de trabajo", icon: Briefcase, path: "/dashboard/nuevo-puesto" },
    { id: "puestosPublicados", label: "Puestos de trabajo publicados", icon: FileText, path: "/dashboard/puestos-publicados" },
    { id: "analisisIA", label: "Análisis IA Candidatos", icon: Brain, path: "/dashboard/analisis-ia" },
    { id: "planActual", label: "Plan actual", icon: CreditCard, path: "/dashboard/plan-actual" },
  ];

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
  } = useCvUploader({
    fileInputRef,
    setCvFiles,
    setSelectedCV,
    setCvAnalysis,
    currentCvCount: currentAnalysisCount,
  });

  const handleCVClick = (index) => {
    setSelectedCV(index);
    const clickedCvAnalysis = cvFiles[index].analysis;
    if (typeof clickedCvAnalysis.then === 'function') {
        // console.warn("Dashboard: ¡El análisis clickeado es una Promesa! Esto no debería suceder con las nuevas subidas.");
        clickedCvAnalysis.then(resolved => {
            setCvAnalysis(resolved);
        }).catch(err => {
            // console.error("Dashboard: Error al resolver promesa en handleCVClick", err);
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
    const candidateDatabaseIdToDelete = cvFileToDelete?.candidate_database_id;

    if (!cvDatabaseIdToDelete && !candidateDatabaseIdToDelete) {
      console.warn("Dashboard: Intento de eliminar CV sin ID de BD o ID de Candidato. No se puede eliminar de Supabase:", cvFileToDelete);
      toast({ title: "Error", description: "No se proporcionó ID de base de datos de CV ni de Candidato para eliminar. No se puede eliminar de Supabase.", variant: "destructive" });
      return;
    }

    try {
      await cvService.deleteCV(cvDatabaseIdToDelete, candidateDatabaseIdToDelete);
      toast({ title: "CV Eliminado", description: "El CV y los datos asociados han sido eliminados." });

      const updatedCvFiles = cvFiles.filter(cv =>
        (cvDatabaseIdToDelete && cv.cv_database_id !== cvDatabaseIdToDelete) ||
        (candidateDatabaseIdToDelete && cv.candidate_database_id !== candidateDatabaseIdToDelete)
      );
      setCvFiles(updatedCvFiles);
      
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
    setEditingJob(jobToEdit);
    navigate("/dashboard/nuevo-puesto");
  };

  const handleJobPublishedOrUpdated = (job) => {
    if (editingJob) {
      setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? job : j));
      toast({ title: "Puesto Actualizado", description: `${job.title} ha sido actualizado.` });
    } else {
      setJobs(prevJobs => [job, ...prevJobs]);
    }
    setEditingJob(null);
  };

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
    const updatedCvFiles = [...cvFiles];

    for (const cvFile of unsavedCVs) {
      try {
        const analysis = typeof cvFile.analysis.then === 'function'
          ? await cvFile.analysis
          : cvFile.analysis;

        const result = await cvService.saveCV({
          fileName: cvFile.name,
          fileContent: cvFile.text,
          analysis: analysis,
          userId: user?.id,
        });

        if (result && result.data) {
          savedCount++;
          const indexToUpdate = updatedCvFiles.findIndex(cv => cv.name === cvFile.name && !cv.cv_database_id);
          if (indexToUpdate !== -1) {
            updatedCvFiles[indexToUpdate] = {
              ...updatedCvFiles[indexToUpdate],
              cv_database_id: result.data.cvId,
              candidate_database_id: result.data.candidateId,
              analysis: analysis,
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
      <header className="bg-slate-900 text-white p-3 shadow-md flex justify-between items-center">
        <div className="text-lg font-semibold">
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
        <aside className="w-60 md:w-72 bg-white p-4 shadow-lg space-y-3 border-r border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-5 px-2">HR Intelligence</h1>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 p-2.5 rounded-md text-left text-sm font-medium transition-colors
                  ${
                    location.pathname === item.path || (item.id === "cargarNuevoCV" && location.pathname === "/dashboard")
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-gray-100 hover:text-slate-800"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${location.pathname === item.path || (item.id === "cargarNuevoCV" && location.pathname === "/dashboard") ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

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
              userSubscription={userSubscription}
              analysisLimit={analysisLimit}
              currentAnalysisCount={currentAnalysisCount}
              optimisticCurrentAnalysisCount={optimisticCvCount}
              effectiveLimits={effectiveLimits}
              isBonusPlanActive={isBonusPlanActive}
              bonusCvUsed={bonusCvUsed}
              bonusCvTotal={bonusCvTotal}
              bonusJobUsed={bonusJobUsed}
              bonusJobTotal={bonusJobTotal}
              bonusMatchUsed={bonusMatchUsed}
              bonusMatchTotal={bonusMatchTotal}
              isBasePlanActive={isBasePlanActive}
              basePlan={basePlan}
              onCvUploadSuccess={refreshUser}
            />
            );
          })()}

          <Routes>
            <Route path="/" element={
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
                userSubscription={userSubscription}
                analysisLimit={analysisLimit}
                currentAnalysisCount={currentAnalysisCount}
                optimisticCurrentAnalysisCount={optimisticCvCount}
                effectiveLimits={effectiveLimits}
                isBonusPlanActive={isBonusPlanActive}
                bonusCvUsed={bonusCvUsed}
                bonusCvTotal={bonusCvTotal}
                bonusJobUsed={bonusJobUsed}
                bonusJobTotal={bonusJobTotal}
                bonusMatchUsed={bonusMatchUsed}
                bonusMatchTotal={bonusMatchTotal}
                isBasePlanActive={isBasePlanActive}
                basePlan={basePlan}
                onCvUploadSuccess={refreshUser}
              />
            } />
            <Route path="cvs-procesados" element={
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
                hasUnsavedCVs={hasUnsavedCVs}
                onSaveAllCVs={handleSaveAllCVs}
                isCvSaved={!!cvFiles[selectedCV]?.cv_database_id || !!cvFiles[selectedCV]?.candidate_database_id}
                navigate={navigate}
              />
            } />
            <Route path="candidate-profile/:candidateId" element={<CVAnalysis analysis={cvAnalysis} />} />
            <Route path="nuevo-puesto" element={
              <CreateNewJobTab
                setActiveTab={setActiveTab}
                currentJobsCount={currentJobCount}
                onJobPublishedOrUpdated={handleJobPublishedOrUpdated}
                editingJob={editingJob}
                setEditingJob={setEditingJob}
                effectiveLimits={effectiveLimits}
                isBonusPlanActive={isBonusPlanActive}
                bonusJobUsed={bonusJobUsed}
                bonusJobTotal={bonusJobTotal}
                isBasePlanActive={isBasePlanActive}
                basePlan={basePlan}
              />
            } />
            <Route path="puestos-publicados" element={
              <PublishedJobsTab
                jobs={jobs}
                isLoadingJobs={isLoadingJobs}
                onDeleteJob={handleDeleteJob}
                onEditJob={handleEditJob}
                setActiveTab={setActiveTab}
                currentJobCount={currentJobCount}
                effectiveLimits={effectiveLimits}
              />
            } />
            <Route path="analisis-ia" element={
              <AIAnalysisTab
                jobs={jobs}
                recruiterId={user?.id}
                matchLimit={matchLimit}
                currentMatchCount={currentMatchCount}
                cvFilesFromDashboard={cvFiles}
                isLoadingCandidates={isLoadingCVs}
                isLoadingJobs={isLoadingJobs}
              />
            } />
            <Route path="plan-actual" element={<CurrentPlanTab />} />
          </Routes>
          <Outlet />

          {activeTab === "nuevoPuesto" && (() => {
            return (
            <CreateNewJobTab
              setActiveTab={setActiveTab}
              currentJobsCount={currentJobCount}
              onJobPublishedOrUpdated={handleJobPublishedOrUpdated}
              editingJob={editingJob}
              setEditingJob={setEditingJob}
              effectiveLimits={effectiveLimits}
              isBonusPlanActive={isBonusPlanActive}
              bonusJobUsed={bonusJobUsed}
              bonusJobTotal={bonusJobTotal}
              isBasePlanActive={isBasePlanActive}
              basePlan={basePlan}
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
