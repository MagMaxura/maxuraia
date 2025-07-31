import React, { useEffect, useState } from 'react';
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

  const [cvAnalysisData, setCvAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCvData = async () => {
      if (!candidateId || !user?.id) {
        setError("ID de candidato o ID de usuario no disponible.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Aquí necesitamos una forma de obtener un CV específico por candidate_id
        // cvService.getCandidatosConCVsByRecruiterId devuelve todos los candidatos
        // Necesitamos una función que devuelva un solo candidato con su CV principal
        const fetchedCandidatos = await cvService.getCandidatosConCVsByRecruiterId(user.id);
        const targetCandidato = fetchedCandidatos.find(c => c.id === candidateId);

        if (targetCandidato) {
          const cvPrincipal = targetCandidato.cvs && targetCandidato.cvs.length > 0
            ? targetCandidato.cvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
            : null;

          let analysisData = cvPrincipal?.analysis_result || {};
          
          // Poblar análisis con datos del candidato si no están en analysis_result
          analysisData.nombre = targetCandidato.name || analysisData.nombre;
          analysisData.email = targetCandidato.email || analysisData.email;
          analysisData.telefono = targetCandidato.phone || analysisData.telefono;
          analysisData.localidad = targetCandidato.location || analysisData.localidad;
          analysisData.nivel_escolarizacion = targetCandidato.title || analysisData.nivel_escolarizacion || analysisData.title;
          analysisData.resumen = targetCandidato.summary || analysisData.summary;
          analysisData.experiencia = targetCandidato.experience || analysisData.experiencia;
          
          if (Array.isArray(targetCandidato.skills) && targetCandidato.skills.length > 0) {
             analysisData.habilidades = { tecnicas: targetCandidato.skills, blandas: [] };
          } else if (cvPrincipal?.analysis_result?.habilidades) {
            analysisData.habilidades = cvPrincipal.analysis_result.habilidades;
          } else {
            analysisData.habilidades = { tecnicas: [], blandas: [] };
          }

          if (cvPrincipal?.content && (!analysisData.textoCompleto || analysisData.textoCompleto.trim() === '')) {
            analysisData.textoCompleto = cvPrincipal.content;
          }

          setCvAnalysisData({
            analysis: analysisData,
            cv_database_id: cvPrincipal?.id || targetCandidato.cv_id || null,
            candidate_database_id: targetCandidato.id,
            name: targetCandidato.name || cvPrincipal?.file_name || `Candidato ${targetCandidato.id}`,
            originalFile: null, // No tenemos el archivo original aquí
          });
        } else {
          setError("Candidato no encontrado.");
        }
      } catch (err) {
        console.error("Error al cargar el análisis del CV:", err);
        setError("Error al cargar el análisis del CV. Por favor, inténtalo de nuevo.");
        toast({ title: "Error", description: "No se pudo cargar el análisis del CV.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCvData();
  }, [candidateId, user?.id, toast]);

  const handleBackToDashboard = () => {
    navigate('/dashboard/cvsProcesados'); // Navegar de vuelta a la pestaña de CVs procesados
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
          // onSaveSuccess y onDeleteCV no son necesarios aquí, ya que esta página es solo para visualización
          // y la edición/eliminación se maneja en el dashboard principal.
        />
      </div>
    </div>
  );
}

export default CVAnalysisPage;