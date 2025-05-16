import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { processJobMatches } from '../../services/matchingService';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../lib/supabase'; // Asegurar que supabase esté importado

// Componentes simples para la UI
const Select = ({ value, onChange, options, placeholder, disabled }) => (
  <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="border p-2 rounded">
    <option value="">{placeholder || 'Seleccionar...'}</option>
    {options.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

const Checkbox = ({ checked, onChange, label, id, disabled }) => ( // Añadir prop disabled
  <div className="flex items-center">
    <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="mr-2" disabled={disabled} />
    <label htmlFor={id} className={disabled ? 'text-gray-500' : ''}>{label}</label>
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
      console.log(`[AIAnalysisTab] Fetching existing matches for job ID: ${jobId}`);
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select(`
          *,
          candidatos (id, name)
        `)
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });

      if (fetchError) {
        console.error("[AIAnalysisTab] Error fetching existing matches:", fetchError);
        throw fetchError;
      }
      
      const formattedResults = data.map(match => ({
        ...match,
        candidato_name: match.candidatos?.name || 'N/A',
        recommendation: typeof match.recommendation === 'boolean' ? match.recommendation : (match.analysis && match.analysis.toLowerCase().includes("recomendación: sí"))
      })) || [];
      
      console.log("[AIAnalysisTab] Fetched and formatted matches:", formattedResults);
      setAnalysisResults(formattedResults);

    } catch (err) {
      console.error("[AIAnalysisTab] Error in fetchExistingMatchesForJob:", err);
      toast({ title: "Error", description: "No se pudieron cargar los análisis existentes para este puesto.", variant: "destructive" });
      setAnalysisResults([]); 
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
  }, [selectedJobId]); // fetchExistingMatchesForJob ahora es estable, por lo que no necesita ser una dependencia explícita
                       // si el linter de hooks no lo exige. Si lo exige, se puede re-añadir.
                       // Por ahora, se quita para asegurar que solo selectedJobId dispare el efecto.

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
    // Solo seleccionar/deseleccionar candidatos que no estén ya analizados si se quiere evitar re-análisis
    // Por ahora, selecciona todos los mostrados.
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
    
    const candidatesToActuallyProcess = Array.from(selectedCandidateIds).filter(candidateId => 
      !analysisResults.some(match => match.candidato_id === candidateId)
    );

    if (candidatesToActuallyProcess.length === 0 && selectedCandidateIds.size > 0) {
      toast({ title: "Información", description: "Todos los candidatos seleccionados ya han sido analizados para este puesto.", variant: "default" });
      // Opcionalmente, recargar los resultados existentes si no se hace automáticamente
      // await fetchExistingMatchesForJob(selectedJobId); 
      return;
    }
    
    if (candidatesToActuallyProcess.length === 0) {
       toast({ title: "Advertencia", description: "Por favor, selecciona al menos un candidato que no haya sido analizado.", variant: "default" });
       return;
    }


    setIsLoadingAnalysis(true);
    setError('');

    const currentJob = jobs.find(j => j.id === selectedJobId);
    const jobTitle = currentJob ? currentJob.title : `ID ${selectedJobId}`;
    
    console.log(`[AIAnalysisTab] Iniciando análisis para el puesto "${jobTitle}" con ${candidatesToActuallyProcess.length} candidato(s) (nuevos).`);
    
    candidatesToActuallyProcess.forEach(candidateId => {
      const candidate = candidatesForSelection.find(c => c.id === candidateId);
      const candidateName = candidate ? candidate.name : `ID ${candidateId}`;
      console.log(`[AIAnalysisTab] Candidato a procesar: ${candidateName} (ID: ${candidateId}) para el puesto: "${jobTitle}"`);
    });

    try {
      const results = await processJobMatches(selectedJobId, candidatesToActuallyProcess);
      
      console.log(`[AIAnalysisTab] Resultados crudos de processJobMatches para el puesto "${jobTitle}":`, results);

      results.forEach(result => {
        const candidate = candidatesForSelection.find(c => c.id === result.candidato_id);
        const candidateName = candidate ? candidate.name : `ID ${result.candidato_id}`;
        if (result.error) {
          console.error(`[AIAnalysisTab] Error al procesar/guardar análisis para ${candidateName} (Puesto: "${jobTitle}"): ${result.saveError || result.analysis}`);
        } else if (result.alreadyExisted) { // Aunque filtramos, processJobMatches puede tener su propia lógica
          console.log(`[AIAnalysisTab] Análisis para ${candidateName} (Puesto: "${jobTitle}") ya existía (según servicio). Score: ${result.match_score}.`);
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
  
  const analyzedCandidateIds = useMemo(() => 
    new Set(analysisResults.map(match => match.candidato_id)),
    [analysisResults]
  );

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
          <Button 
            onClick={handleRunAnalysis} 
            disabled={isLoadingAnalysis || !selectedJobId || selectedCandidateIds.size === 0 || Array.from(selectedCandidateIds).every(id => analyzedCandidateIds.has(id))}
          >
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
                    {candidatesForSelection.map(candidate => {
                      const isAnalyzed = analyzedCandidateIds.has(candidate.id);
                      return (
                        <Checkbox
                          key={candidate.id}
                          id={`candidate-${candidate.id}`}
                          checked={selectedCandidateIds.has(candidate.id)}
                          onChange={() => handleCandidateSelection(candidate.id)}
                          label={`${candidate.name}${isAnalyzed ? ' (Analizado)' : ''}`}
                          disabled={isAnalyzed} // Deshabilitar si ya está analizado
                        />
                      );
                    })}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decisión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razonamiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resumen General</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysisResults.map(match => (
                    <tr key={match.id || `${match.job_id}-${match.candidato_id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.candidato_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.match_score}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.recommendation ? 'Sí' : 'No'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{match.recommendation_reasoning_display || match.recommendation_reasoning || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{match.summary_display || match.summary || 'N/A'}</td>
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