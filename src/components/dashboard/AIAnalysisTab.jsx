import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../../lib/supabase'; // Se comenta o elimina si fetchCandidates también se va
import { processJobMatches } from '../../services/matchingService';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../lib/supabase'; // Mantener por ahora para fetchCandidates

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


export function AIAnalysisTab({ jobs = [], isLoadingJobs = false }) { // Recibir jobs e isLoadingJobs como props
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [analysisResults, setAnalysisResults] = useState([]);

  // const [isLoadingJobs, setIsLoadingJobs] = useState(false); // Se recibe de props
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');

  const { toast } = useToast();

  // fetchJobs ya no es necesario aquí, los jobs vienen de props

  const fetchCandidates = useCallback(async () => {
    setIsLoadingCandidates(true);
    setError('');
    try {
      // Solo cargamos nombre e id para la selección
      const { data, error } = await supabase.from('candidatos').select('id, name').order('name');
      if (error) throw error;
      setCandidates(data || []);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setError('Error al cargar los candidatos.');
      toast({ title: "Error", description: "No se pudieron cargar los candidatos.", variant: "destructive" });
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [toast]);

  // Cargar datos iniciales de candidatos
  useEffect(() => {
    // fetchJobs(); // Ya no se llama aquí
    fetchCandidates();
  }, [fetchCandidates]); // fetchJobs eliminado de dependencias

  // Cargar resultados de análisis existentes cuando se selecciona un trabajo
  const fetchExistingMatchesForJob = useCallback(async (jobId) => {
    if (!jobId) {
      setAnalysisResults([]);
      return;
    }
    setIsLoadingAnalysis(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          candidatos (id, name)
        `)
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });

      if (error) throw error;
      setAnalysisResults(data.map(match => ({
        ...match,
        // Asegurar que el nombre del candidato esté disponible
        candidato_name: match.candidatos?.name || 'N/A',
        // Extraer recomendación del texto de análisis para visualización rápida
        recommendation: match.analysis && match.analysis.toLowerCase().includes("recomendación: sí")
      })) || []);
    } catch (err) {
      console.error("Error fetching existing matches:", err);
      toast({ title: "Error", description: "No se pudieron cargar los análisis existentes para este puesto.", variant: "destructive" });
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
      setSelectedCandidateIds(new Set(candidates.map(c => c.id)));
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
      
      // Actualizar los resultados, combinando con los existentes y reordenando
      // Esto es importante si processJobMatches devuelve tanto nuevos como existentes
      await fetchExistingMatchesForJob(selectedJobId); // Recargar para obtener la vista más actualizada y ordenada
      
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
  const allCandidatesSelected = candidates.length > 0 && selectedCandidateIds.size === candidates.length;

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
            {isLoadingCandidates ? <p>Cargando candidatos...</p> : ( // Usar la prop isLoadingCandidates
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