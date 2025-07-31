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
    console.log("CVAnalysisPage useEffect - candidateId:", candidateId, "user?.id:", user?.id);
    const fetchCvData = async () => {
      if (!candidateId || !user?.id) {
        setError("ID de candidato o ID de usuario no disponible.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const fetchedCandidatos = await cvService.getCandidatosConCVsByRecruiterId(user.id);
        const targetCandidato = fetchedCandidatos.find(c => c.id === candidateId);

        if (targetCandidato) {
          const cvPrincipal = targetCandidato.cvs && targetCandidato.cvs.length > 0
            ? targetCandidato.cvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
            : null;

          // Construir newAnalysisData de forma inmutable para evitar re-renders innecesarios
          const newAnalysisData = { ...cvPrincipal?.analysis_result || {} };
          
          newAnalysisData.nombre = targetCandidato.name || newAnalysisData.nombre;
          newAnalysisData.email = targetCandidato.email || newAnalysisData.email;
          newAnalysisData.telefono = targetCandidato.phone || newAnalysisData.telefono;
          newAnalysisData.localidad = targetCandidato.location || newAnalysisData.localidad;
          newAnalysisData.nivel_escolarizacion = targetCandidato.title || newAnalysisData.nivel_escolarizacion || newAnalysisData.title;
          newAnalysisData.resumen = targetCandidato.summary || newAnalysisData.summary;
          newAnalysisData.experiencia = targetCandidato.experience || newAnalysisData.experiencia;
          
          if (Array.isArray(targetCandidato.skills) && targetCandidato.skills.length > 0) {
             newAnalysisData.habilidades = { tecnicas: targetCandidato.skills, blandas: [] };
          } else if (cvPrincipal?.analysis_result?.habilidades) {
            newAnalysisData.habilidades = cvPrincipal.analysis_result.habilidades;
          } else {
            newAnalysisData.habilidades = { tecnicas: [], blandas: [] };
          }

          if (cvPrincipal?.content && (!newAnalysisData.textoCompleto || newAnalysisData.textoCompleto.trim() === '')) {
            newAnalysisData.textoCompleto = cvPrincipal.content;
          }

          // Solo actualizar el estado si los datos realmente han cambiado para evitar bucles de re-renderizado
          if (JSON.stringify(newAnalysisData) !== JSON.stringify(cvAnalysisData?.analysis)) {
            console.log("CVAnalysisPage: Actualizando cvAnalysisData.");
            setCvAnalysisData({
              analysis: newAnalysisData,
              cv_database_id: cvPrincipal?.id || targetCandidato.cv_id || null,
              candidate_database_id: targetCandidato.id,
              name: targetCandidato.name || cvPrincipal?.file_name || `Candidato ${targetCandidato.id}`,
              originalFile: null,
            });
          } else {
            console.log("CVAnalysisPage: cvAnalysisData no ha cambiado, evitando actualización de estado.");
          }
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
  }, [candidateId, user?.id, toast, cvAnalysisData]); // Añadir cvAnalysisData a las dependencias para la comparación

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