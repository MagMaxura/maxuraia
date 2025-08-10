import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cvService } from '@/services/cvService';
import EditableCV from '@/components/EditableCV';
import CandidateNotes from '@/components/CandidateNotes';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

function CandidateProfilePage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [candidateData, setCandidateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNotes, setIsSavingNotes] = useState(false); // Nuevo estado para guardar notas
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidateData = async () => {
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
          // Asegurarse de que fetchedCandidato.cvs sea un array para poder ordenarlo
          const candidateCvs = Array.isArray(targetCandidato.cvs) ? targetCandidato.cvs : (targetCandidato.cvs ? [targetCandidato.cvs] : []);
          const cvPrincipal = candidateCvs.length > 0
            ? candidateCvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
            : null;

          setCandidateData({
            ...targetCandidato,
            cvPrincipal: cvPrincipal,
            analysis: cvPrincipal?.analysis_result || {},
            notes: targetCandidato.notas || "", // Cargar notas
          });
        } else {
          setError("Candidato no encontrado.");
        }
      } catch (err) {
        console.error("Error al cargar el perfil del candidato:", err);
        setError("Error al cargar el perfil del candidato. Por favor, inténtalo de nuevo.");
        toast({ title: "Error", description: "No se pudo cargar el perfil del candidato.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidateData();
  }, [candidateId, user?.id, toast]);

  const handleSaveCandidate = async (updatedAnalysis) => {
    if (!candidateData?.id || !user?.id) {
      toast({ title: "Error", description: "No se pudo guardar el perfil: faltan datos.", variant: "destructive" });
      return;
    }

    setIsLoading(true); // Usar isLoading para el estado de guardado también
    try {
      const candidateUpdatePayload = {
        name: updatedAnalysis.nombre,
        email: updatedAnalysis.email,
        phone: updatedAnalysis.telefono,
        location: updatedAnalysis.localidad,
        age: updatedAnalysis.edad,
        experience: updatedAnalysis.experiencia,
        skills: [
          ...(updatedAnalysis.habilidades?.tecnicas || []),
          ...(updatedAnalysis.habilidades?.blandas || [])
        ].filter(Boolean),
        summary: updatedAnalysis.resumen,
        title: updatedAnalysis.nivel_escolarizacion,
      };

      await cvService.updateCandidate(candidateData.id, candidateUpdatePayload, user.id);

      // Actualizar el analysis_result del CV principal si existe
      if (candidateData.cvPrincipal?.id) {
        const cvUpdatePayload = {
          analysis_result: updatedAnalysis,
          content: updatedAnalysis.textoCompleto || candidateData.cvPrincipal.content,
        };
        await cvService.saveCvAndCandidate(updatedAnalysis, user.id, candidateData.cvPrincipal.id, candidateData.id, candidateData.cvPrincipal.file_name, null);
      }

      toast({ title: "Perfil Guardado", description: "El perfil del candidato ha sido actualizado exitosamente." });
      // Refrescar los datos después de guardar para asegurar consistencia
      // Esto podría causar un re-fetch completo, pero asegura que la UI esté sincronizada.
      // Opcional: actualizar el estado local directamente si la respuesta del servicio es completa.
      setCandidateData(prev => ({
        ...prev,
        analysis: updatedAnalysis,
        name: updatedAnalysis.nombre,
        email: updatedAnalysis.email,
        phone: updatedAnalysis.telefono,
        location: updatedAnalysis.localidad,
        title: updatedAnalysis.nivel_escolarizacion,
        summary: updatedAnalysis.resumen,
        experience: updatedAnalysis.experiencia,
        skills: [
          ...(updatedAnalysis.habilidades?.tecnicas || []),
          ...(updatedAnalysis.habilidades?.blandas || [])
        ].filter(Boolean),
      }));

    } catch (err) {
      console.error("Error al guardar el perfil del candidato:", err);
      toast({ title: "Error al Guardar", description: "No se pudo guardar el perfil del candidato.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async (id, newNotes) => {
    if (!id || !user?.id) {
      toast({ title: "Error", description: "No se pudo guardar las notas: faltan datos.", variant: "destructive" });
      return;
    }

    setIsSavingNotes(true);
    try {
      await cvService.updateCandidateNotes(id, newNotes, user.id);
      setCandidateData(prev => ({ ...prev, notes: newNotes }));
      toast({ title: "Notas Guardadas", description: "Las notas del candidato han sido actualizadas exitosamente." });
    } catch (err) {
      console.error("Error al guardar las notas del candidato:", err);
      toast({ title: "Error al Guardar Notas", description: "No se pudo guardar las notas del candidato.", variant: "destructive" });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard/cvsProcesados');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-slate-700">Cargando perfil del candidato...</p>
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

  if (!candidateData || !candidateData.analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Perfil no disponible</h2>
          <p className="text-slate-700">No se pudo encontrar el perfil o el análisis para este candidato.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Perfil del Candidato: {candidateData.name || "Sin Nombre"}
          </h2>
          <EditableCV
            analysis={candidateData.analysis}
            onSave={handleSaveCandidate}
            isSaving={isLoading} // Pasar isLoading como isSaving
          />
        </div>
        <div className="md:col-span-1">
          <CandidateNotes
            candidateId={candidateData.id}
            initialNotes={candidateData.notes}
            onSave={handleSaveNotes}
            isSaving={isSavingNotes}
          />
        </div>
      </div>
    </div>
  );
}

export default CandidateProfilePage;