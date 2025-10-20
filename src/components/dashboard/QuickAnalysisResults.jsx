import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickAnalysisResults = ({
  selectedJob,
  isLoadingExistingMatches,
  analysisResults,
  t, // Add t as a prop
}) => {
  const navigate = useNavigate();

  return (
    <>
      {selectedJob && (isLoadingExistingMatches || analysisResults.length > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
          <h3 className="text-xl font-semibold text-slate-700 mb-4">{t('quick_analysis_results_title')}: {selectedJob.title}</h3>
          {isLoadingExistingMatches ? (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>{t('quick_analysis_loading_existing_analysis')}</p>
            </div>
          ) : analysisResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quick_analysis_candidate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quick_analysis_score')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quick_analysis_decision')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quick_analysis_summary')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quick_analysis_status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quick_analysis_actions')}</th>
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
                        {result.status === "completed" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('quick_analysis_completed')}</span>}
                        {result.status === "error" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{t('quick_analysis_error')}</span>}
                        {result.status === "duplicate" && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{t('quick_analysis_duplicate')}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {result.status === "completed" && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(`/dashboard/analisis-ia?candidateId=${result.candidateId}&jobId=${result.jobId}`)}
                            className="text-blue-600 hover:text-blue-900 p-0 h-auto"
                          >
                            {t('quick_analysis_view_details')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !isLoadingExistingMatches && <p>{t('quick_analysis_no_results')}</p>
          )}
        </div>
      )}
    </>
  );
};

export default QuickAnalysisResults;