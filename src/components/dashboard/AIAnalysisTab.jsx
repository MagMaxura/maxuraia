import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { processJobMatches } from '../../services/matchingService';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';

// Componentes simples para la UI (puedes reemplazarlos con los tuyos de ShadCN/ui u otros)
const Select = ({ value, onChange, options, placeholder, disabled }) => (
  <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="border p-2 rounded">
    <option value="">{placeholder || 'Seleccionar...'}</option>
    {options.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

const Checkbox = ({ checked, onChange, label, id }) => (
  <div className="flex items-center">
    <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="mr-2" />
    <label htmlFor={id}>{label}</label>
  </div>
);

export function AIAnalysisTab({ 
  jobs = [], 
  isLoadingJobs = false, 
  cvFilesFromDashboard = [], 
  isLoadingCandidates = false 
}) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');

  const { toast } = useToast();

  const candidatesForSelection = useMemo(() => {
    if (!cvFilesFromDashboard) return [];
    const uniqueCandidates = new Map();
    cvFilesFromDashboard.forEach(cv => {
      if (cv.candidate_database_id && typeof cv.name === 'string' && cv.name.trim() !== '') {
        if (!uniqueCandidates.has(cv.candidate_database_id)) {
          uniqueCandidates.set(cv.candidate_database_id, {
            id: cv.candidate_database_id,
            name: cv.name 
          });
        }
      }
    });
    return Array.from(uniqueCandidates.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [cvFilesFromDashboard]);

  const fetchExistingMatchesForJob = useCallback(async (jobId) => {
    if (!jobId) {
      setAnalysisResults([]);
      return;
    }
    setIsLoadingAnalysis(true);
    try {
      // NOTA: Esta función necesita ser refactorizada para obtener datos de 'matches'.
      // Actualmente, no usa `supabase` directamente.
      console.warn("[AIAnalysisTab] fetchExistingMatchesForJob: Carga de análisis existentes pendiente de refactorización para no depender de supabase aquí.");
      // Simulación: se podrían obtener los matches a través de `processJobMatches` o un nuevo servicio.
      // Por ahora, se limpiarán los resultados y se mostrará un toast.
      setAnalysisResults([]); 
      // toast({ title: "Info", description: "La carga de análisis existentes está pendiente de refactorización.", variant: "default" });
    } catch (err) {
      console.error("[AIAnalysisTab] Error en fetchExistingMatchesForJob (pendiente de refactor):", err);
      toast({ title: "Error", description: "No se pudieron cargar los análisis existentes (pendiente de refactor).", variant: "destructive" });
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedJobId) {
      fetchExistingMatchesForJob(selectedJobId);
    } else {
      setAnalysisResults([]);
    }
  }, [selectedJobId, fetchExistingMatchesForJob]);

  const handleCandidateSelection = (candidateId) => {
    setSelectedCandidateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleSelectAllCandidates = (isChecked) => {
    if (isChecked) {
      setSelectedCandidateIds(new Set(candidatesForSelection.map(c => c.id)));
    } else {
      setSelectedCandidateIds(new Set());
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedJobId) {
      toast({ title: "Advertencia", description: "Por favor, selecciona un puesto de trabajo.", variant: "default" });
      return;
    }
    if (selectedCandidateIds.size === 0) {
      toast({ title: "Advertencia", description: "Por favor, selecciona al menos un candidato.", variant: "default" });
      return;
    }

    setIsLoadingAnalysis(true);
    setError('');

    const currentJob = jobs.find(j => j.id === selectedJobId);
    const jobTitle = currentJob ? currentJob.title : `ID ${selectedJobId}`;
    const candidateIdsToProcess = Array.from(selectedCandidateIds);

    console.log(`[AIAnalysisTab] Iniciando análisis para el puesto "${jobTitle}" con ${candidateIdsToProcess.length} candidato(s) seleccionados.`);
    
    candidateIdsToProcess.forEach(candidateId => {
      const candidate = candidatesForSelection.find(c => c.id === candidateId);
      const candidateName = candidate ? candidate.name : `ID ${candidateId}`;
      console.log(`[AIAnalysisTab] Candidato a procesar: ${candidateName} (ID: ${candidateId}) para el puesto: "${jobTitle}"`);
    });

    try {
      const results = await processJobMatches(selectedJobId, candidateIdsToProcess);
      
      console.log(`[AIAnalysisTab] Resultados crudos de processJobMatches para el puesto "${jobTitle}":`, results);

      results.forEach(result => {
        const candidate = candidatesForSelection.find(c => c.id === result.candidato_id);
        const candidateName = candidate ? candidate.name : `ID ${result.candidato_id}`;
        if (result.error) {
          console.error(`[AIAnalysisTab] Error al procesar/guardar análisis para ${candidateName} (Puesto: "${jobTitle}"): ${result.saveError || result.analysis}`);
        } else if (result.alreadyExisted) {
          console.log(`[AIAnalysisTab] Análisis para ${candidateName} (Puesto: "${jobTitle}") ya existía. Score: ${result.match_score}.`);
        } else {
          console.log(`[AIAnalysisTab] Nuevo análisis guardado exitosamente para ${candidateName} (Puesto: "${jobTitle}"). Score: ${result.match_score}.`);
        }
      });
      
      await fetchExistingMatchesForJob(selectedJobId); 
      
      const newAnalysesCount = results.filter(r => !r.alreadyExisted && !r.error).length;
      toast({ title: "Análisis Completado", description: `Se procesaron ${newAnalysesCount} nuevos análisis para el puesto "${jobTitle}".` });

    } catch (err) {
      console.error(`[AIAnalysisTab] Error general al ejecutar el análisis para el puesto "${jobTitle}":`, err);
      setError('Ocurrió un error durante el análisis.');
      toast({ title: "Error de Análisis", description: err.message || "Ocurrió un error.", variant: "destructive" });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const jobOptions = jobs.map(job => ({ value: job.id, label: job.title }));
  const allCandidatesSelected = candidatesForSelection.length > 0 && selectedCandidateIds.size === candidatesForSelection.length;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Análisis IA de Candidatos por Puesto</h2>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="text-lg font-medium">Selección de Puesto y Candidatos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="job-select" className="block text-sm font-medium text-gray-700 mb-1">Puesto de Trabajo</label>
            <Select
              id="job-select"
              value={selectedJobId}
              onChange={setSelectedJobId}
              options={jobOptions}
              placeholder={isLoadingJobs ? "Cargando puestos..." : "Selecciona un puesto"}
              disabled={isLoadingJobs || isLoadingAnalysis}
            />
          </div>
          <Button onClick={handleRunAnalysis} disabled={isLoadingAnalysis || !selectedJobId || selectedCandidateIds.size === 0}>
            {isLoadingAnalysis ? 'Analizando...' : 'Analizar Candidatos Seleccionados'}
          </Button>
        </div>
        
        {selectedJobId && (
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Seleccionar Candidatos</h4>
            {isLoadingCandidates ? <p>Cargando candidatos...</p> : (
              <>
                {candidatesForSelection.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                     <Checkbox
                        id="select-all-candidates"
                        checked={allCandidatesSelected}
                        onChange={handleSelectAllCandidates}
                        label="Seleccionar Todos / Deseleccionar Todos"
                      />
                    {candidatesForSelection.map(candidate => (
                      <Checkbox
                        key={candidate.id}
                        id={`candidate-${candidate.id}`}
                        checked={selectedCandidateIds.has(candidate.id)}
                        onChange={() => handleCandidateSelection(candidate.id)}
                        label={candidate.name}
                      />
                    ))}
                  </div>
                ) : <p>No hay candidatos disponibles o CVs cargados.</p>}
              </>
            )}
          </div>
        )}
      </div>

      {selectedJobId && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Resultados del Análisis para: {jobs.find(j => j.id === selectedJobId)?.title}</h3>
          {isLoadingAnalysis && !analysisResults.length ? <p>Cargando análisis...</p> : null}
          {analysisResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recomendado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resumen del Análisis</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysisResults.map(match => (
                    <tr key={match.id || `${match.job_id}-${match.candidato_id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.candidato_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.match_score}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.recommendation ? 'Sí' : 'No'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{match.analysis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !isLoadingAnalysis && <p>No hay resultados de análisis para mostrar para este puesto. Selecciona candidatos y ejecuta el análisis.</p>
          )}
        </div>
      )}
    </div>
  );
}