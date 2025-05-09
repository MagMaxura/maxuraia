
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
    // Mantener fondo claro general (el p-4 actual o un bg-gray-50 si se prefiere un gris muy sutil)
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      {/* Header del Dashboard */}
      <nav className="bg-white shadow rounded-lg mb-6 md:mb-8 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 md:space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">HR Intelligence</h1>
          {user?.company && (
            <>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-sm md:text-base text-slate-600 hidden sm:inline">{user.company}</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          className="text-slate-600 hover:bg-slate-100" // Texto oscuro para header blanco
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Columna de CVs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-lg border border-gray-200" // Card blanco
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">CVs</h2> {/* Texto oscuro */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <Button
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white" // Botón azul
                disabled={isProcessing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isProcessing ? "Procesando..." : "Subir CV"}
              </Button>
            </label>
          </div>
          <div className="space-y-3">
            {cvFiles.length === 0 && !isProcessing && (
              <p className="text-slate-500 text-sm text-center py-4">No hay CVs subidos todavía.</p>
            )}
            {cvFiles.map((file, index) => (
              <div
                key={index}
                className={`p-3 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                  selectedCV === index
                  ? "bg-blue-100 border-blue-300" // Selección azul claro
                  : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                }`}
                onClick={() => handleCVClick(index)}
              >
                <span className="text-slate-700 font-medium truncate" title={file.name}>{file.name}</span> {/* Texto oscuro */}
                <span className="text-sm text-slate-500"> {/* Texto gris medio */}
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Columna de Análisis del CV */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 lg:col-span-2" // Card blanco
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Análisis del CV</h2> {/* Texto oscuro */}
          </div>
          {cvAnalysis ? (
            <CVAnalysis analysis={cvAnalysis} />
          ) : (
            <div className="text-center text-slate-500 py-12"> {/* Texto gris medio */}
              <p className="text-lg">Selecciona un CV de la lista para ver su análisis detallado aquí.</p>
            </div>
          )}
        </motion.div>

        {/* Sección de Puestos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 lg:col-span-3" // Card blanco
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Puestos</h2> {/* Texto oscuro */}
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white" // Botón azul
              onClick={handleAddJob}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Nuevo Puesto
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.length === 0 && (
              <p className="text-slate-500 text-sm md:col-span-2 xl:col-span-3 text-center py-4">No hay puestos creados todavía.</p>
            )}
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:shadow-md transition-shadow"
              >
                <h3 className="text-slate-700 font-semibold">{job.title}</h3> {/* Texto oscuro */}
                <p className="text-slate-600 text-sm mt-1 line-clamp-3">{job.description}</p> {/* Texto gris medio */}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
