
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, Users, Briefcase, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import CVAnalysis from "@/components/CVAnalysis";

function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cvs");
  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0]; // Procesamos un archivo a la vez
      const text = await extractTextFromFile(file);
      const analysis = analyzeCV(text);
      
      setCvFiles([...cvFiles, { ...file, analysis }]);
      setSelectedCV(cvFiles.length);
      setCvAnalysis(analysis);
      
      toast({
        title: "CV procesado",
        description: "El CV ha sido analizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error al procesar el CV",
        description: "No se pudo procesar el archivo. Asegúrate de que sea un PDF o DOCX válido.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCVClick = (index) => {
    setSelectedCV(index);
    setCvAnalysis(cvFiles[index].analysis);
  };

  const handleAddJob = () => {
    const newJob = {
      id: Date.now(),
      title: "Nuevo Puesto",
      description: "Descripción del puesto...",
    };
    setJobs([...jobs, newJob]);
    toast({
      title: "Puesto añadido",
      description: "Se ha creado un nuevo puesto de trabajo.",
    });
  };

  return (
    <div className="min-h-screen p-4">
      <nav className="glass-card mb-8 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">HR Intelligence</h1>
          <span className="text-gray-200">|</span>
          <span className="text-gray-200">{user?.company}</span>
        </div>
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">CVs</h2>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <Button 
                variant="outline" 
                className="text-white border-white/20"
                disabled={isProcessing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isProcessing ? "Procesando..." : "Subir CV"}
              </Button>
            </label>
          </div>
          <div className="space-y-4">
            {cvFiles.map((file, index) => (
              <div
                key={index}
                className={`bg-white/5 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors ${
                  selectedCV === index ? "border border-white/40" : ""
                }`}
                onClick={() => handleCVClick(index)}
              >
                <span className="text-gray-200">{file.name}</span>
                <span className="text-sm text-gray-400">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Análisis del CV</h2>
          </div>
          {cvAnalysis ? (
            <CVAnalysis analysis={cvAnalysis} />
          ) : (
            <div className="text-center text-gray-300 py-8">
              <p>Selecciona un CV para ver su análisis</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 col-span-3"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Puestos</h2>
            <Button
              variant="outline"
              className="text-white border-white/20"
              onClick={handleAddJob}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Nuevo Puesto
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white/5 p-3 rounded-lg"
              >
                <h3 className="text-white font-medium">{job.title}</h3>
                <p className="text-gray-300 text-sm mt-1">{job.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
