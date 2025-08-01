
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Importar Link
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Briefcase as BriefcaseIcon, Users, Search } from 'lucide-react';
import CVAnalysis from "@/components/CVAnalysis";

function CandidateSelection({ candidates: propCandidates }) { // Recibe candidatos como prop
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState(propCandidates); // Usa la prop para inicializar
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    // Cargar trabajos desde localStorage (los CVs ahora vienen por prop)
    const savedJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    setJobs(savedJobs);
  }, []);

  useEffect(() => {
    setCandidates(propCandidates); // Actualiza los candidatos si la prop cambia
  }, [propCandidates]);

  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    
    // Simular ranking de candidatos basado en palabras clave
    const keywords = job.keywords.toLowerCase().split(',').map(k => k.trim());
    
    const ranked = candidates.map(candidate => {
      let score = 0;
      const candidateText = `${candidate.experiencia} ${candidate.habilidades.join(' ')}`.toLowerCase();
      
      keywords.forEach(keyword => {
        if (candidateText.includes(keyword)) {
          score += 1;
        }
      });

      return {
        ...candidate,
        score,
        matchReason: `Este candidato coincide con ${score} de los requisitos clave del puesto.`
      };
    });

    // Ordenar por puntuación
    ranked.sort((a, b) => b.score - a.score);
    setRankedCandidates(ranked);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Puesto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <BriefcaseIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Seleccionar Puesto</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <Button
              key={job.id}
              variant={selectedJob?.id === job.id ? "default" : "outline"}
              className="w-full justify-start text-left"
              onClick={() => handleJobSelect(job)}
            >
              <span className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-2" />
                {job.title}
              </span>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Candidatos Rankeados */}
      {selectedJob && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Candidatos Preseleccionados</h2>
          </div>

          <div className="space-y-4">
            {rankedCandidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCandidate?.id === candidate.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Link to={`/dashboard/candidate-profile/${candidate.id}`} className="text-blue-600 hover:underline">
                      <h3 className="font-medium text-gray-900">{candidate.name} - {candidate.title || candidate.nivel_escolarizacion || "Sin título"}</h3>
                    </Link>
                    <p className="text-sm text-gray-500">{candidate.matchReason}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-semibold">
                      Match: {Math.round((candidate.score / selectedJob.keywords.split(',').length) * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detalle del Candidato */}
      {selectedCandidate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <CVAnalysis analysis={selectedCandidate} />
        </motion.div>
      )}
    </div>
  );
}

export default CandidateSelection;
