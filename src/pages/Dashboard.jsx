import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, Routes, Route, Outlet, useLocation, useParams } from "react-router-dom";
import { Upload, Users, Briefcase, LogOut, FileText, CreditCard, FileUp, Brain, Calendar } from "lucide-react";
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
import QuickAnalysisTab from "@/components/dashboard/QuickAnalysisTab.jsx";
import CalendarTab from "@/components/dashboard/CalendarTab.jsx";
import { useDashboardData } from "@/hooks/useDashboardData.js";
import { useCvUploader } from "@/hooks/useCvUploader.js";
import { useTranslation } from 'react-i18next'; // Importar useTranslation

function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { candidateId } = useParams(); // Obtener candidateId de la URL
  const [activeTab, setActiveTab] = useState(location.pathname);
  const { t } = useTranslation(); // Obtener la función de traducción

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
    refreshDashboardData, // Obtener la nueva función de refresco
  } = useDashboardData();

  const isTrialExpired = userSubscription?.plan_id === 'trial' &&
                         userSubscription?.trial_ends_at &&
                         new Date(userSubscription.trial_ends_at) < new Date();

  if (isTrialExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">{t('trial_expired_title')}</h2>
          <p className="text-slate-700">{t('trial_expired_message')}</p>
          <Button onClick={() => navigate('/#pricing')} className="bg-blue-600 hover:bg-blue-700 text-white">
            {t('view_available_plans')}
          </Button>
          <Button variant="ghost" onClick={logout} className="text-slate-600 hover:underline">
            {t('logout')}
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
        // Si el candidato no se encuentra, simplemente no se selecciona nada o se maneja de otra forma
        // No navegar, ya que queremos permanecer en la misma pestaña
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
  }, [cvFiles, selectedCV, cvAnalysis, candidateId, location.pathname]);

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
    { id: "cargarNuevoCV", label: t('upload_new_cv'), icon: Upload, path: "/dashboard" },
    { id: "cvsProcesados", label: t('processed_cvs_tab'), icon: Users, path: "/dashboard/cvs-procesados" },
    { id: "nuevoPuesto", label: t('create_new_job_tab'), icon: Briefcase, path: "/dashboard/nuevo-puesto" },
    { id: "puestosPublicados", label: t('published_jobs_tab'), icon: FileText, path: "/dashboard/puestos-publicados" },
    { id: "analisisIA", label: t('ai_analysis_tab'), icon: Brain, path: "/dashboard/analisis-ia" },
    { id: "quickAnalysis", label: t('quick_analysis_tab'), icon: FileUp, path: "/dashboard/analisis-rapido" },
    { id: "calendario", label: t('calendar_tab'), icon: Calendar, path: "/dashboard/calendario" },
    { id: "planActual", label: t('current_plan_tab'), icon: CreditCard, path: "/dashboard/plan-actual" },
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
    processingFiles, // Añadir processingFiles
  } = useCvUploader({
    fileInputRef,
    setCvFiles,
    setSelectedCV,
    setCvAnalysis,
    setActiveTab, // Pasar setActiveTab
    currentCvCount: currentAnalysisCount,
    refreshDashboardData, // Pasar refreshDashboardData
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
      title: t('job_added_title'),
      description: t('job_created_message'),
    });
  };

  const handleDeleteCV = async (cvFileToDelete) => {
    const cvDatabaseIdToDelete = cvFileToDelete?.cv_database_id;
    const candidateDatabaseIdToDelete = cvFileToDelete?.candidate_database_id;

    if (!cvDatabaseIdToDelete && !candidateDatabaseIdToDelete) {
      console.warn("Dashboard: Intento de eliminar CV sin ID de BD o ID de Candidato. No se puede eliminar de Supabase:", cvFileToDelete);
      toast({ title: t('error_title'), description: t('no_cv_id_provided_delete'), variant: "destructive" });
      return;
    }

    try {
      await cvService.deleteCV(cvDatabaseIdToDelete, candidateDatabaseIdToDelete);
      toast({ title: t('cv_deleted_title'), description: t('cv_deleted_message') });

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
      toast({ title: t('error_deleting_title'), description: t('error_deleting_cv_message', { message: error.message }), variant: "destructive" });
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!jobId) {
      toast({ title: t('error_title'), description: t('no_job_id_provided'), variant: "destructive" });
      return;
    }
    if (!window.confirm(t('confirm_delete_job'))) {
      return;
    }
    try {
      await cvService.deleteJobPost(jobId);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({ title: t('job_deleted_title'), description: t('job_deleted_message') });
    } catch (error) {
      console.error("Dashboard: Error eliminando puesto:", error);
      toast({ title: t('error_deleting_title'), description: t('error_deleting_job_message', { message: error.message }), variant: "destructive" });
    }
  };

  const handleEditJob = (jobToEdit) => {
    setEditingJob(jobToEdit);
    navigate("/dashboard/nuevo-puesto");
  };

  const handleJobPublishedOrUpdated = (job) => {
    if (editingJob) {
      setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? job : j));
      toast({ title: t('job_updated_title'), description: t('job_updated_message', { jobTitle: job.title }) });
    } else {
      setJobs(prevJobs => [job, ...prevJobs]);
    }
    setEditingJob(null);
  };

  const handleSaveAllCVs = async () => {
    const unsavedCVs = cvFiles.filter(cv => !cv.cv_database_id);

    if (unsavedCVs.length === 0) {
      toast({
        title: t('no_unsaved_cvs_title'),
        description: t('all_cvs_saved_message'),
      });
      return;
    }

    toast({
      title: t('saving_cvs_title'),
      description: t('saving_cvs_message', { count: unsavedCVs.length }),
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
             title: t('error_saving_cv_title'),
             description: t('no_data_returned_save_cv', { fileName: cvFile.name }),
             variant: "destructive",
           });
         }

      } catch (error) {
        console.error("Dashboard: Error al guardar CV:", cvFile.name, error);
        toast({
          title: t('error_saving_cv_title'),
          description: t('could_not_save_cv', { fileName: cvFile.name, message: error.message }),
          variant: "destructive",
        });
      }
    }

    setCvFiles(updatedCvFiles);

    if (savedCount > 0) {
      toast({
        title: t('save_complete_title'),
        description: t('saved_cvs_count_message', { savedCount: savedCount, totalUnsaved: unsavedCVs.length }),
      });
    } else {
       toast({
         title: t('save_finished_title'),
         description: t('no_cv_saved_message'),
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
            <span className="text-sm font-medium hidden sm:inline">{t('company')}: {user.company}</span>
          )}
          <Button
            variant="ghost"
            className="text-white hover:bg-slate-700 px-3 py-1.5 text-sm"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('logout')}
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-60 md:w-72 bg-white p-4 shadow-lg space-y-3 border-r border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-5 px-2">{t('hr_intelligence_title')}</h1>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setActiveTab(item.path);
                }}
                className={`w-full flex items-center space-x-3 p-2.5 rounded-md text-left text-sm font-medium transition-colors
                  ${
                    activeTab === item.path || (item.id === "cargarNuevoCV" && activeTab === "/dashboard")
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-gray-100 hover:text-slate-800"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.path || (item.id === "cargarNuevoCV" && activeTab === "/dashboard") ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto">

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
                processingFiles={processingFiles} // Pasar processingFiles
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
            <Route path="nuevo-puesto" element={
              <CreateNewJobTab
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
            <Route path="analisis-rapido" element={
              <QuickAnalysisTab
                jobs={jobs}
                recruiterId={user?.id}
                matchLimit={matchLimit}
                currentMatchCount={currentMatchCount}
                onCvUploadSuccess={refreshUser}
                refreshDashboardData={refreshDashboardData}
                effectiveLimits={effectiveLimits}
                isBonusPlanActive={isBonusPlanActive}
                bonusCvUsed={bonusCvUsed}
                bonusCvTotal={bonusCvTotal}
                bonusMatchUsed={bonusMatchUsed}
                bonusMatchTotal={bonusMatchTotal}
                isBasePlanActive={isBasePlanActive}
                basePlan={basePlan}
                currentAnalysisCount={currentAnalysisCount}
                analysisLimit={analysisLimit}
              />
            } />
            <Route path="calendario" element={<CalendarTab />} />
            <Route path="plan-actual" element={<CurrentPlanTab />} />
          </Routes>
          <Outlet />

        </main>
      </div>
    </div>
  );
}

export default Dashboard;

