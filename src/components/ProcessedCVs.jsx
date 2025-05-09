import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { cvService } from "../services/cvService";
import CVAnalysis from "./CVAnalysis";

function ProcessedCVs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cvs, setCvs] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCVs();
  }, [user?.id]);

  const loadCVs = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const data = await cvService.getCVsByRecruiterId(user.id);
      setCvs(data);
    } catch (error) {
      console.error('Error al cargar CVs:', error);
      toast({
        title: "Error al cargar CVs",
        description: "No se pudieron cargar los CVs. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCV = async (cvId) => {
    try {
      await cvService.deleteCV(cvId);
      setCvs(prevCvs => prevCvs.filter(cv => cv.id !== cvId));
      if (selectedCV?.id === cvId) {
        setSelectedCV(null);
      }
      toast({
        title: "CV eliminado",
        description: "El CV ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error al eliminar CV:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el CV. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const filteredCVs = cvs.filter(cv => {
    const candidate = cv.candidatos[0]; // Asumimos que hay un candidato por CV
    if (!candidate) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      candidate.name?.toLowerCase().includes(searchLower) ||
      candidate.skills?.some(skill => skill.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="linkedin-section p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">CVs Procesados</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o habilidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredCVs.map((cv) => {
            const candidate = cv.candidatos[0];
            if (!candidate) return null;

            return (
              <motion.div
                key={cv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedCV?.id === cv.id
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-white border border-gray-200 hover:shadow-md"
                }`}
                onClick={() => setSelectedCV(cv)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(cv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={() => setSelectedCV(cv)}
                    >
                      Ver detalles
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCV(cv.id);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredCVs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron CVs que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      </motion.section>

      {selectedCV && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="linkedin-section p-6"
        >
          <CVAnalysis analysis={selectedCV.analysis_result} />
        </motion.section>
      )}
    </div>
  );
}

export default ProcessedCVs;
