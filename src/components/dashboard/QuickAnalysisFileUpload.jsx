import React from "react";
import { Upload, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const QuickAnalysisFileUpload = ({
  fileInputRef,
  handleFileUpload,
  handleDragOver,
  handleDrop,
  isProcessing,
  isBulkProcessing,
  isAnalyzing,
  currentFileProcessingName,
  filesUploadedCount,
  totalFilesToUpload,
}) => {
  const { t } = useTranslation();

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
  );
};

export default QuickAnalysisFileUpload;