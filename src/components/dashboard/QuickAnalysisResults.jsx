import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickAnalysisResults = ({
  selectedJob,
  isLoadingExistingMatches,
  analysisResults,
  processingFiles = [], // Añadir la prop processingFiles con un valor por defecto
  translate, // Add t as a prop
}) => {
  const navigate = useNavigate();

  return (
    <>
      {selectedJob && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
          <h3 className="text-xl font-semibold text-slate-700 mb-4">{translate('quick_analysis_results_title')}: {selectedJob.title}</h3>

          {/* Sección para CVs en proceso de carga/análisis */}
          {processingFiles.filter(file =>
            !['completed', 'error', 'duplicate', 'skipped', 'matching_completed', 'matching_error'].includes(file.matchingStatus)
          ).length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-slate-600 mb-3">{translate('quick_analysis_processing_cvs')}</h4>
              <div className="space-y-2">
                {processingFiles.filter(file =>
                  !['completed', 'error', 'duplicate', 'skipped', 'matching_completed', 'matching_error'].includes(file.matchingStatus)
                ).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                    <span className="text-sm font-medium text-gray-800">{file.name}</span>
                    <div className="flex items-center space-x-2">
                      {file.matchingStatus === 'matching_pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{translate('quick_analysis_status_matching_pending')}</span>}
                      {file.matchingStatus === 'matching_in_progress' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{translate('quick_analysis_status_matching_in_progress')}</span>}
                      {file.matchingStatus === 'matching_error' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{translate('quick_analysis_status_matching_error')}</span>}
                      {/* Fallback a los estados del uploader si no hay estado de matching específico */}
                      {file.matchingStatus === 'pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{translate('quick_analysis_status_pending')}</span>}
                      {file.matchingStatus === 'extracting' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{translate('quick_analysis_status_extracting')}</span>}
                      {file.matchingStatus === 'analyzing' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">{translate('quick_analysis_status_analyzing')}</span>}
                      {file.matchingStatus === 'saving' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">{translate('quick_analysis_status_saving')}</span>}
                      {file.matchingStatus === 'duplicate' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{translate('quick_analysis_status_duplicate')}</span>}
                      {file.matchingStatus === 'skipped' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">{translate('quick_analysis_status_skipped')}</span>}
                      {(file.matchingStatus === 'extracting' || file.matchingStatus === 'analyzing' || file.matchingStatus === 'saving' || file.matchingStatus === 'matching_in_progress') && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección para resultados de análisis existentes o completados */}
          {isLoadingExistingMatches ? (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>{translate('quick_analysis_loading_existing_analysis')}</p>
            </div>
          ) : analysisResults.length > 0 ? (
            <div className="overflow-x-auto">
              <h4 className="text-lg font-medium text-slate-600 mb-3 mt-6">{translate('quick_analysis_completed_analysis')}</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translate('quick_analysis_candidate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translate('quick_analysis_score')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translate('quick_analysis_decision')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translate('quick_analysis_summary')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translate('quick_analysis_status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translate('quick_analysis_actions')}</th>
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
                        {result.status === "completed" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{translate('quick_analysis_completed')}</span>}
                        {result.status === "error" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{translate('quick_analysis_error')}</span>}
                        {result.status === "duplicate" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{translate('quick_analysis_duplicate')}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {result.status === "completed" && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(`/dashboard/analisis-ia?candidateId=${result.candidateId}&jobId=${result.jobId}`)}
                            className="text-blue-600 hover:text-blue-900 p-0 h-auto"
                          >
                            {translate('quick_analysis_view_details')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !isLoadingExistingMatches && processingFiles.length === 0 && <p>{translate('quick_analysis_no_results')}</p>
          )}
        </div>
      )}
    </>
  );
};

export default QuickAnalysisResults;