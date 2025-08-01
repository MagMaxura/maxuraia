import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cvService } from '@/services/cvService';
import CVAnalysis from '@/components/CVAnalysis';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

function CVAnalysisPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [fetchedCandidato, setFetchedCandidato] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCvData = async () => {
      if (!candidateId || !user?.id) {
        console.log("[CVAnalysisPage] ID de candidato o ID de usuario no disponible. candidateId:", candidateId, "user.id:", user?.id);
        setError("ID de candidato o ID de usuario no disponible.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        console.log("[CVAnalysisPage] Iniciando fetch de datos de CV para candidateId:", candidateId, "y recruiterId:", user.id);
        const fetchedCandidatos = await cvService.getCandidatosConCVsByRecruiterId(user.id);
        console.log("[CVAnalysisPage] Candidatos obtenidos:", fetchedCandidatos.length);
        const targetCandidato = fetchedCandidatos.find(c => c.id === candidateId);
        console.log("[CVAnalysisPage] Candidato objetivo encontrado:", !!targetCandidato);

        if (targetCandidato) {
          setFetchedCandidato(targetCandidato);
          console.log("[CVAnalysisPage] Estado fetchedCandidato actualizado con:", targetCandidato.id);
        } else {
          setError("Candidato no encontrado.");
          console.warn("[CVAnalysisPage] Candidato no encontrado para ID:", candidateId);
        }
      } catch (err) {
        console.error("Error al cargar el análisis del CV:", err);
        setError("Error al cargar el análisis del CV. Por favor, inténtalo de nuevo.");
        toast({ title: "Error", description: "No se pudo cargar el análisis del CV.", variant: "destructive" });
      } finally {
        setIsLoading(false);
        console.log("[CVAnalysisPage] Finalizado el fetch de datos de CV. isLoading:", false);
      }
    };

    fetchCvData();
  }, [candidateId, user?.id, toast]);

  const cvAnalysisData = useMemo(() => {
    console.log("[CVAnalysisPage] useMemo: Recalculando cvAnalysisData. fetchedCandidato:", !!fetchedCandidato);
    if (!fetchedCandidato) return null;

    const cvPrincipal = fetchedCandidato.cvs && fetchedCandidato.cvs.length > 0
      ? fetchedCandidato.cvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;
    console.log("[CVAnalysisPage] useMemo: CV principal identificado:", cvPrincipal?.id, "Nombre archivo:", cvPrincipal?.file_name);

    console.log("[CVAnalysisPage] cvPrincipal?.analysis_result:", cvPrincipal?.analysis_result);
    const newAnalysisData = { ...cvPrincipal?.analysis_result || {} };
    
    newAnalysisData.nombre = fetchedCandidato.name || newAnalysisData.nombre;
    newAnalysisData.email = fetchedCandidato.email || newAnalysisData.email;
    newAnalysisData.telefono = fetchedCandidato.phone || newAnalysisData.telefono;
    newAnalysisData.localidad = fetchedCandidato.location || newAnalysisData.localidad;
    newAnalysisData.nivel_escolarizacion = fetchedCandidato.title || newAnalysisData.nivel_escolarizacion || newAnalysisData.title;
    newAnalysisData.resumen = fetchedCandidato.summary || newAnalysisData.summary;
    newAnalysisData.experiencia = fetchedCandidato.experience || newAnalysisData.experiencia;
    
    if (Array.isArray(fetchedCandidato.skills) && fetchedCandidato.skills.length > 0) {
       newAnalysisData.habilidades = { tecnicas: fetchedCandidato.skills, blandas: [] };
    } else if (cvPrincipal?.analysis_result?.habilidades) {
      newAnalysisData.habilidades = cvPrincipal.analysis_result.habilidades;
    } else {
      newAnalysisData.habilidades = { tecnicas: [], blandas: [] };
    }

    if (cvPrincipal?.content && (!newAnalysisData.textoCompleto || newAnalysisData.textoCompleto.trim() === '')) {
      newAnalysisData.textoCompleto = cvPrincipal.content;
      console.log("[CVAnalysisPage] useMemo: Texto completo del CV actualizado desde cvPrincipal.content.");
    }

    return {
      analysis: newAnalysisData,
      cv_database_id: cvPrincipal?.id || fetchedCandidato.cv_id || null,
      candidate_database_id: fetchedCandidato.id,
      name: fetchedCandidato.name || cvPrincipal?.file_name || `Candidato ${fetchedCandidato.id}`,
      originalFile: null,
    };
  }, [fetchedCandidato]); // Dependencia: fetchedCandidato
  console.log("[CVAnalysisPage] useMemo: cvAnalysisData final:", cvAnalysisData);

  const handleBackToDashboard = () => {
    navigate('/dashboard/cvsProcesados');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-slate-700">Cargando análisis del CV...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-slate-700">{error}</p>
          <Button onClick={handleBackToDashboard} className="bg-blue-600 hover:bg-blue-700 text-white">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!cvAnalysisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Análisis no disponible</h2>
          <p className="text-slate-700">No se pudo encontrar el análisis para este CV.</p>
          <Button onClick={handleBackToDashboard} className="bg-blue-600 hover:bg-blue-700 text-white">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <Button onClick={handleBackToDashboard} className="mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300">
        ← Volver a CVs Procesados
      </Button>
      <div className="bg-white p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Análisis del CV: {cvAnalysisData.name}
        </h2>
        <CVAnalysis
          analysis={cvAnalysisData.analysis}
          userId={user?.id}
          originalFile={cvAnalysisData.originalFile}
          cvDatabaseId={cvAnalysisData.cv_database_id}
          candidateDatabaseId={cvAnalysisData.candidate_database_id}
        />
      </div>
    </div>
  );
}

export default CVAnalysisPage;