import React from "react";
import { useTranslation } from "react-i18next";
import { useQuickAnalysis } from "@/hooks/useQuickAnalysis.js";
import QuickAnalysisJobSelection from "./QuickAnalysisJobSelection";
import FileUploadComponent from "./FileUploadComponent";
import QuickAnalysisResults from "./QuickAnalysisResults";

const QuickAnalysisTab = ({
  jobs = [],
  recruiterId,
  refreshDashboardData,
  currentAnalysisCount,
}) => {
  const { t } = useTranslation();
  const {
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
    filteredJobs,
    handleSelectJob,
    cvProcessingAndMatchingStatus, // Exponer el nuevo estado combinado
  } = useQuickAnalysis({
    jobs,
    recruiterId,
    refreshDashboardData,
    currentAnalysisCount,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">{t('quick_analysis_tab')}</h2>
      <p className="text-slate-600">
        Carga CVs y compáralos automáticamente con un puesto de trabajo publicado.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickAnalysisJobSelection
          selectedJob={selectedJob}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          filteredJobs={filteredJobs}
          handleSelectJob={handleSelectJob}
          translate={t} // Pass t as a prop
        />

        <FileUploadComponent
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          isProcessing={isProcessing}
          isBulkProcessing={isBulkProcessing}
          isAnalyzing={isAnalyzing}
          currentFileProcessingName={currentFileProcessingName}
          filesUploadedCount={filesUploadedCount}
          totalFilesToUpload={totalFilesToUpload}
          translate={t}
          processingFiles={uploaderProcessingFiles} // Pasar el estado de procesamiento
        />
      </div>

      <QuickAnalysisResults
        selectedJob={selectedJob}
        isLoadingExistingMatches={isLoadingExistingMatches}
        analysisResults={analysisResults}
        processingFiles={cvProcessingAndMatchingStatus} // Pasar el estado combinado de procesamiento y matching
        translate={t} // Pass t as a prop
      />
    </div>
  );
};

export default QuickAnalysisTab;