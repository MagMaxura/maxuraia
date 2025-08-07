import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { processJobMatches } from '../../services/matchingService';
import EditableCV from '../EditableCV'; // Importar EditableCV
import CandidateNotes from '../CandidateNotes'; // Importar CandidateNotes
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input'; // Importar el componente Input
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { X } from 'lucide-react'; // Importar el icono X

// Componentes simples para la UI
const Select = ({ value, onChange, options, placeholder, disabled }) => (
  <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="border p-2 rounded">
    <option value="">{placeholder || 'Seleccionar...'}</option>
    {options.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

const TextInput = ({ value, onChange, placeholder, disabled }) => (
  <Input
    type="text"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className="border p-2 rounded w-full"
  />
);

const Checkbox = ({ checked, onChange, label, id, disabled }) => (
  <div className="flex items-center">
    <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="mr-2" disabled={disabled} />
    <label htmlFor={id} className={disabled ? 'text-gray-500' : ''}>{label}</label>
  </div>
);

const parseAnalysisText = (analysisText) => {
  if (!analysisText || typeof analysisText !== 'string') {
    return { decision: 'N/A', reasoning: 'N/A', summary: analysisText || 'N/A', recommendation_boolean: false };
  }

  let decision = 'N/A';
  let reasoning = 'N/A';
  let summary = analysisText; // Fallback inicial
  let recommendation_boolean = false;

  // Nuevo formato: "Decisión de Recomendación: Sí. Razonamiento: Buen fit. Resumen General: Prometedor."
  const newFormatDecisionMatch = analysisText.match(/Decisión de Recomendación: (.*?)\.(?: Razonamiento:|$)/i);
  if (newFormatDecisionMatch && newFormatDecisionMatch[1]) {
    decision = newFormatDecisionMatch[1].trim();
    recommendation_boolean = decision.toLowerCase() === 'sí';

    const newFormatReasoningMatch = analysisText.match(/Razonamiento: (.*?)\.(?: Resumen General:|$)/i);
    if (newFormatReasoningMatch && newFormatReasoningMatch[1]) {
      reasoning = newFormatReasoningMatch[1].trim();
    }

    const newFormatSummaryMatch = analysisText.match(/Resumen General: (.*)/i);
    if (newFormatSummaryMatch && newFormatSummaryMatch[1]) {
      summary = newFormatSummaryMatch[1].trim();
    } else if (newFormatReasoningMatch && newFormatReasoningMatch[0]) { 
        const reasoningEndIndex = analysisText.toLowerCase().indexOf(newFormatReasoningMatch[0].toLowerCase()) + newFormatReasoningMatch[0].length;
        summary = analysisText.substring(reasoningEndIndex).trim();
         if(summary.startsWith(".")) summary = summary.substring(1).trim();
    } else { 
         const decisionEndIndex = analysisText.toLowerCase().indexOf(newFormatDecisionMatch[0].toLowerCase()) + newFormatDecisionMatch[0].length;
         summary = analysisText.substring(decisionEndIndex).trim();
         if(summary.startsWith(".")) summary = summary.substring(1).trim();
    }
    if (summary === "") summary = "No disponible (parseado)"; // Evitar summary vacío si solo había decisión/razonamiento

  } else {
    // Intentar parsear formato antiguo: "Recomendación: Sí. Resumen: Carlos Al..."
    const oldFormatRecomMatch = analysisText.match(/Recomendación: (Sí|No|Si)\.(?: Resumen:|$)/i); // Añadido 'Si'
    if (oldFormatRecomMatch && oldFormatRecomMatch[1]) {
      decision = oldFormatRecomMatch[1].trim();
      recommendation_boolean = decision.toLowerCase() === 'sí' || decision.toLowerCase() === 'si';
      
      const summarySplit = analysisText.split(/Resumen: /i);
      summary = summarySplit.length > 1 ? summarySplit[1].trim() : analysisText; 
      reasoning = 'N/A (formato antiguo)'; 
    } else {
        recommendation_boolean = analysisText.toLowerCase().includes("recomendación: sí") || analysisText.toLowerCase().includes("recomendación: si");
        // Si no es ninguno de los formatos conocidos, decision y reasoning quedan N/A, summary es el texto completo.
    }
  }
  return { decision, reasoning, summary, recommendation_boolean };
};


export function AIAnalysisTab({
  jobs = [],
  isLoadingJobs = false,
  cvFilesFromDashboard = [],
  isLoadingCandidates = false,
  recruiterId, // Nueva prop
  matchLimit, // Límite de macheos
  currentMatchCount // Contador de macheos
}) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');
  const [titleFilter, setTitleFilter] = useState(''); // Nuevo estado para el filtro de título
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const [selectedCandidateProfileId, setSelectedCandidateProfileId] = useState(null); // Estado para el ID del candidato en el modal
  const [candidateProfileData, setCandidateProfileData] = useState(null); // Estado para los datos del perfil del candidato
  const [isLoadingProfile, setIsLoadingProfile] = useState(false); // Estado para la carga del perfil
  const [isSavingProfileNotes, setIsSavingProfileNotes] = useState(false); // Nuevo estado para guardar notas del perfil

  const { toast } = useToast();

  const candidatesForSelection = useMemo(() => {
    if (!cvFilesFromDashboard) return [];
    const uniqueCandidates = new Map();
    cvFilesFromDashboard.forEach(cv => {
      if (cv.candidate_database_id && typeof cv.name === 'string' && cv.name.trim() !== '') {
        if (!uniqueCandidates.has(cv.candidate_database_id)) {
          uniqueCandidates.set(cv.candidate_database_id, {
            id: cv.candidate_database_id,
            name: cv.name,
            title: cv.analysis?.title || cv.analysis?.nivel_escolarizacion || "Sin título" // Añadir el título
          });
        }
      }
    });

    let filteredCandidates = Array.from(uniqueCandidates.values());

    // Aplicar filtro por título
    if (titleFilter) {
      const lowerCaseFilter = titleFilter.toLowerCase();
      filteredCandidates = filteredCandidates.filter(candidate =>
        candidate.title.toLowerCase().includes(lowerCaseFilter)
      );
    }

    return filteredCandidates.sort((a, b) => a.name.localeCompare(b.name));
  }, [cvFilesFromDashboard, titleFilter]); // Añadir titleFilter a las dependencias

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
      
      const formattedResults = data.map(match => {
        const analysisText = match.analysis || ''; // Asegurar que sea una cadena
        const parsed = parseAnalysisText(analysisText);
        return {
          ...match,
          analysis: analysisText, // Asegurar que el 'analysis' en el resultado sea una cadena
          candidato_name: match.candidatos?.name || 'N/A',
          recommendation: parsed.recommendation_boolean,
          summary_display: parsed.summary,
          recommendation_reasoning_display: parsed.reasoning,
          recommendation_decision_text: parsed.decision,
        };
      }) || [];
      
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

  const fetchCandidateProfile = useCallback(async (candidateId) => {
    if (!candidateId || !recruiterId) {
      setCandidateProfileData(null);
      return;
    }
    setIsLoadingProfile(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('candidatos')
        .select(`
          *,
          cvs (id, file_name, analysis_result, created_at, content)
        `)
        .eq('id', candidateId)
        .eq('recruiter_id', recruiterId)
        .single();

      if (fetchError) {
        console.error("[AIAnalysisTab] Error fetching candidate profile:", fetchError);
        throw fetchError;
      }

      if (data) {
        const candidateCvs = Array.isArray(data.cvs) ? data.cvs : (data.cvs ? [data.cvs] : []);
        const cvPrincipal = candidateCvs.length > 0
          ? candidateCvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          : null;

        setCandidateProfileData({
          ...data,
          cvPrincipal: cvPrincipal,
          analysis: {
            ...(cvPrincipal?.analysis_result || {}),
            habilidades: [
              ...(cvPrincipal?.analysis_result?.habilidades?.tecnicas || []),
              ...(cvPrincipal?.analysis_result?.habilidades?.blandas || []),
            ].filter(Boolean), // Asegurar que no haya valores nulos/undefined
          },
          notes: data.notas || "", // Cargar notas del candidato
        });
      } else {
        setCandidateProfileData(null);
        toast({ title: "Error", description: "Candidato no encontrado.", variant: "destructive" });
      }
    } catch (err) {
      console.error("[AIAnalysisTab] Error in fetchCandidateProfile:", err);
      toast({ title: "Error", description: "No se pudo cargar el perfil del candidato.", variant: "destructive" });
      setCandidateProfileData(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [recruiterId, toast]);

  const handleSaveProfileNotes = useCallback(async (id, newNotes) => {
    if (!id || !recruiterId) {
      toast({ title: "Error", description: "No se pudo guardar las notas: faltan datos.", variant: "destructive" });
      return;
    }

    setIsSavingProfileNotes(true);
    try {
      await cvService.updateCandidateNotes(id, newNotes, recruiterId);
      setCandidateProfileData(prev => ({ ...prev, notes: newNotes }));
      toast({ title: "Notas Guardadas", description: "Las notas del candidato han sido actualizadas exitosamente." });
    } catch (err) {
      console.error("Error al guardar las notas del candidato desde el modal:", err);
      toast({ title: "Error al Guardar Notas", description: "No se pudo guardar las notas del candidato.", variant: "destructive" });
    } finally {
      setIsSavingProfileNotes(false);
    }
  }, [recruiterId, toast]);

  useEffect(() => {
    if (selectedJobId) {
      fetchExistingMatchesForJob(selectedJobId);
    } else {
      setAnalysisResults([]);
    }
  }, [selectedJobId, fetchExistingMatchesForJob]);

  useEffect(() => {
    if (isProfileModalOpen && selectedCandidateProfileId) {
      fetchCandidateProfile(selectedCandidateProfileId);
    } else if (!isProfileModalOpen) {
      setCandidateProfileData(null); // Limpiar datos cuando el modal se cierra
    }
  }, [isProfileModalOpen, selectedCandidateProfileId, fetchCandidateProfile]);

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
    
    const candidatesToActuallyProcess = Array.from(selectedCandidateIds).filter(candidateId => 
      !analysisResults.some(match => match.candidato_id === candidateId)
    );

    if (candidatesToActuallyProcess.length === 0 && selectedCandidateIds.size > 0) {
      toast({ title: "Información", description: "Todos los candidatos seleccionados ya han sido analizados para este puesto.", variant: "default" });
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
      const results = await processJobMatches(selectedJobId, recruiterId, candidatesToActuallyProcess);
      
      console.log(`[AIAnalysisTab] Resultados crudos de processJobMatches para el puesto "${jobTitle}":`, results);

      results.forEach(result => {
        const candidate = candidatesForSelection.find(c => c.id === result.candidato_id);
        const candidateName = candidate ? candidate.name : `ID ${result.candidato_id}`;
        if (result.error) {
          console.error(`[AIAnalysisTab] Error al procesar/guardar análisis para ${candidateName} (Puesto: "${jobTitle}"): ${result.saveError || result.analysis}`);
        } else if (result.alreadyExisted) { 
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
        
        {/* Contador de Macheos */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md mb-4">
          <p className="text-sm font-medium">
            Macheos realizados este período: {currentMatchCount} de {matchLimit === Infinity ? 'Ilimitados' : (matchLimit || 'N/A')}
          </p>
          <div className="w-full bg-blue-200 rounded-full h-2.5 mt-1">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${matchLimit > 0 ? (currentMatchCount / matchLimit) * 100 : 0}%` }}
            ></div>
          </div>
          {matchLimit === 0 && (
            <p className="text-xs text-red-600 mt-1">No hay límite de macheos disponible. Verifique su suscripción.</p>
          )}
        </div>

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
            <h4 className="text-md font-medium mb-2">Filtrar y Seleccionar Candidatos</h4>
            <div className="mb-3">
              <label htmlFor="title-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Título/Profesión</label>
              <TextInput
                id="title-filter"
                value={titleFilter}
                onChange={setTitleFilter}
                placeholder="Ej: Ingeniero de Software, Administrativo"
                disabled={isLoadingCandidates || isLoadingAnalysis}
              />
            </div>
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
                          label={`${candidate.name} - ${candidate.title}${isAnalyzed ? ' (Analizado)' : ''}`}
                          disabled={isAnalyzed}
                        />
                      );
                    })}
                  </div>
                ) : <p>No hay candidatos disponibles o CVs cargados que coincidan con el filtro.</p>}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th> {/* Nueva columna */}
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
                      <td className="px-6 py-4 text-sm text-gray-500">{match.recommendation_reasoning_display || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{match.summary_display || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          onClick={() => {
                            setSelectedCandidateProfileId(match.candidato_id);
                            setIsProfileModalOpen(true);
                          }}
                          variant="link"
                          className="text-blue-600 hover:text-blue-900 p-0 h-auto"
                        >
                          Ver Perfil
                        </Button>
                      </td>
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
      {/* Modal de Perfil de Candidato */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[1200px] max-h-[90vh] overflow-y-auto relative"> {/* Ajustar el ancho del modal para ser más responsive */}
          <DialogHeader>
            <DialogTitle>
              {isLoadingProfile ? "Cargando Perfil..." : (candidateProfileData?.name || "Perfil del Candidato")}
            </DialogTitle>
            <DialogDescription>
              {isLoadingProfile ? "Obteniendo datos del candidato." : "Información detallada del candidato."}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setIsProfileModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            variant="ghost"
            size="icon"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
          {isLoadingProfile ? (
            <div className="text-center py-10">Cargando perfil...</div>
          ) : candidateProfileData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"> {/* Diseño de dos paneles, asegurar ancho completo */}
              <div className="p-4 bg-white rounded-xl shadow-xl overflow-auto"> {/* Contenedor para EditableCV, añadir overflow-auto */}
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Información del Perfil</h3>
                <EditableCV
                  analysis={candidateProfileData.analysis}
                  onSave={async (updatedAnalysis) => {
                    // La edición del perfil no está habilitada directamente desde este modal
                    toast({ title: "Información", description: "La edición del perfil no está habilitada en esta vista." });
                  }}
                  isSaving={false}
                  readOnly={true} // El perfil es de solo lectura
                />
              </div>
              <CandidateNotes
                candidateId={candidateProfileData.id}
                initialNotes={candidateProfileData.notes}
                onSave={handleSaveProfileNotes}
                isSaving={isSavingProfileNotes}
              />
            </div>
          ) : (
            <div className="text-center py-10">No se pudo cargar la información del candidato.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}