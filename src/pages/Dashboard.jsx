import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, Users, Briefcase, LogOut, FileText, CreditCard, FileUp } from "lucide-react"; // Añadido FileText, CreditCard, FileUp
import { useToast } from "@/components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import CVAnalysis from "@/components/CVAnalysis";
import CreateJobForm from "@/components/CreateJobForm.jsx";
import CreateJobAIForm from "@/components/CreateJobAIForm.jsx";
import { cvService } from "@/services/cvService.js"; // Importar cvService

function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cargarNuevoCV"); // Pestaña inicial
  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Para carga de CVs
  const [isProcessingJob, setIsProcessingJob] = useState(false); // Para generación/publicación de puestos
  const [jobPostData, setJobPostData] = useState(null); // Para datos del puesto (manual o IA)
  const fileInputRef = useRef(null);

  const handleSaveSuccess = (cvId, candidateId, updatedAnalysis) => {
    console.log("Dashboard: handleSaveSuccess called with", { cvId, candidateId, updatedAnalysis });
    // Actualizar el cvFile en el estado cvFiles con los nuevos IDs y el análisis actualizado
    // Esto es importante para que la próxima vez que se seleccione este CV,
    // se sepa que ya existe en la BD y se pueda actualizar en lugar de crear uno nuevo.
    // También asegura que si el análisis fue editado, se refleje en la lista.
    setCvFiles(prevCvFiles => {
      return prevCvFiles.map(cvFile => {
        // Identificar el CV por nombre de archivo original o alguna otra clave única si es necesario
        // Aquí asumimos que el 'updatedAnalysis' tiene el 'textoCompleto' que podemos usar para comparar
        // o si el 'selectedCV' (índice) sigue siendo válido y corresponde al CV guardado.
        // Una forma más robusta sería si 'updatedAnalysis' o 'cvId' permite identificarlo.
        // Por ahora, si el nombre del archivo coincide con el que está seleccionado actualmente.
        if (cvFile.name === cvFiles[selectedCV]?.name) {
          console.log("Dashboard: Updating cvFile in state:", cvFile.name);
          return {
            ...cvFile,
            analysis: updatedAnalysis, // Guardar el análisis posiblemente editado
            cv_database_id: cvId,
            candidate_database_id: candidateId,
          };
        }
        return cvFile;
      });
    });
    // Opcionalmente, podrías querer re-seleccionar el CV para forzar una actualización de 'cvAnalysis'
    // si el objeto 'updatedAnalysis' es diferente en estructura al que ya está en 'cvAnalysis' state.
    // Pero setCvAnalysis(updatedAnalysis) ya debería estar manejado por el flujo normal si es necesario.
  };

  const menuItems = [
    { id: "cargarNuevoCV", label: "Cargar Nuevo CV", icon: Upload },
    { id: "cvsProcesados", label: "CVs Procesados", icon: Users },
    { id: "nuevoPuesto", label: "Nuevo Puesto de trabajo", icon: Briefcase },
    { id: "puestosPublicados", label: "Puestos de trabajo publicados", icon: FileText },
    { id: "planActual", label: "Plan actual", icon: CreditCard },
  ];

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0]; // Procesamos un archivo a la vez
      const text = await extractTextFromFile(file);
      const resolvedAnalysis = await analyzeCV(text); // Usar await aquí
      console.log("Dashboard: resolvedAnalysis from analyzeCV", resolvedAnalysis);

      // Crear un nuevo objeto de archivo con nombre y análisis
      const newCvFile = {
        name: file.name, // Guardar el nombre del archivo
        originalFile: file, // Guardar el archivo original si es necesario para otras operaciones
        analysis: resolvedAnalysis, // Usar el análisis resuelto
        uploadedDate: new Date(),
        cv_database_id: null, // Se poblará después de guardar en BD
        candidate_database_id: null, // Se poblará después de guardar en BD
      };
      
      setCvFiles(prevCvFiles => [...prevCvFiles, newCvFile]);
      // Actualizar selectedCV para apuntar al nuevo archivo y mostrar su análisis
      setSelectedCV(cvFiles.length); // El índice será el actual cvFiles.length antes de añadir el nuevo
      setCvAnalysis(resolvedAnalysis); // Usar el análisis resuelto
      console.log("Dashboard: cvAnalysis state updated with", resolvedAnalysis);
      
      toast({
        title: "CV procesado",
        description: `${file.name} ha sido analizado correctamente.`,
      });
      setActiveTab("cvsProcesados"); // Cambiar a la pestaña de CVs procesados después de subir
    } catch (error) {
      console.error("Error processing CV:", error);
      toast({
        title: "Error al procesar el CV",
        description: `No se pudo procesar el archivo ${files[0]?.name || ''}. Asegúrate de que sea un PDF, DOC o DOCX válido.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Resetear el input para permitir subir el mismo archivo de nuevo
      }
    }
  };

  const handleCVClick = (index) => {
    setSelectedCV(index);
    // cvFiles[index].analysis también podría ser una Promesa si no se resolvió al guardar.
    // Es más seguro re-evaluar o asegurar que se guardó el objeto resuelto.
    // Por ahora, asumimos que el cambio anterior lo resuelve para nuevas subidas.
    // Si se hace clic en un CV antiguo que se subió sin el await, podría seguir siendo una promesa.
    // Una solución más robusta sería asegurar que todos los análisis en cvFiles estén resueltos.
    const clickedCvAnalysis = cvFiles[index].analysis;
    console.log("Dashboard: handleCVClick - analysis object from cvFiles", clickedCvAnalysis);
    if (typeof clickedCvAnalysis.then === 'function') {
        console.warn("Dashboard: ¡El análisis clickeado es una Promesa! Esto no debería suceder con las nuevas subidas.");
        // Opcionalmente, podrías intentar resolverla aquí si es una promesa,
        // pero idealmente debería estar resuelta al guardarse.
        clickedCvAnalysis.then(resolved => {
            console.log("Dashboard: handleCVClick - Promesa resuelta al hacer clic", resolved);
            setCvAnalysis(resolved);
        }).catch(err => {
            console.error("Dashboard: Error al resolver promesa en handleCVClick", err);
            // Manejar el error, quizás mostrar un toast
        });
    } else {
        setCvAnalysis(clickedCvAnalysis);
    }
  };

  const handleAddJob = () => {
    const newJob = {
      id: Date.now(),
      title: "Nuevo Puesto Ejemplo",
      description: "Descripción detallada del nuevo puesto de trabajo...",
    };
    setJobs([...jobs, newJob]);
    toast({
      title: "Puesto añadido",
      description: "Se ha creado un nuevo puesto de trabajo.",
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (fileInputRef.current) {
        fileInputRef.current.files = event.dataTransfer.files; // Asignar archivos al input
        handleFileUpload({ target: { files: event.dataTransfer.files } }); // Simular evento
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Superior */}
      <header className="bg-slate-900 text-white p-3 shadow-md flex justify-between items-center">
        <div className="text-lg font-semibold">
          {/* Podría ir un logo pequeño o HR Intelligence aquí si se prefiere */}
        </div>
        <div className="flex items-center space-x-4">
          {user?.company && (
            <span className="text-sm font-medium hidden sm:inline">Empresa: {user.company}</span>
          )}
          <Button
            variant="ghost"
            className="text-white hover:bg-slate-700 px-3 py-1.5 text-sm"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 md:w-72 bg-white p-4 shadow-lg space-y-3 border-r border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-5 px-2">HR Intelligence</h1>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 p-2.5 rounded-md text-left text-sm font-medium transition-colors
                  ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-gray-100 hover:text-slate-800"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeTab === "cargarNuevoCV" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-xl shadow-xl">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">Cargar nuevo CV</h2>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                  disabled={isProcessing}
                />
                <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-slate-700 font-medium text-base md:text-lg mb-1">
                  Arrastra y suelta tu CV aquí, o haz clic para seleccionar
                </p>
                <p className="text-xs text-slate-500">
                  Formatos aceptados: PDF, DOC, DOCX
                </p>
                {isProcessing && <p className="mt-4 text-blue-600">Procesando...</p>}
              </div>
            </motion.div>
          )}

          {activeTab === "cvsProcesados" && (
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">CVs Procesados</h2>
                {cvFiles.length === 0 && !isProcessing && (
                  <p className="text-slate-500 text-sm text-center py-4">No hay CVs procesados todavía.</p>
                )}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cvFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                        selectedCV === index
                        ? "bg-blue-100 border-blue-300"
                        : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                      }`}
                      onClick={() => handleCVClick(index)}
                    >
                      <span className="text-slate-700 font-medium truncate" title={file.name}>{file.name}</span>
                      <span className="text-xs text-slate-500">
                        {file.uploadedDate.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {cvAnalysis && selectedCV !== null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-xl">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Análisis del CV: {cvFiles[selectedCV]?.name}</h2>
                  <CVAnalysis
                    analysis={cvAnalysis}
                    userId={user?.id}
                    originalFile={cvFiles[selectedCV]?.originalFile}
                    cvDatabaseId={cvFiles[selectedCV]?.cv_database_id}
                    candidateDatabaseId={cvFiles[selectedCV]?.candidate_database_id}
                    onSaveSuccess={handleSaveSuccess} // Pasar la nueva función callback
                  />
                </motion.div>
              )}
               {selectedCV === null && cvFiles.length > 0 && (
                 <p className="text-slate-500 text-center py-4">Selecciona un CV para ver su análisis.</p>
               )}
            </div>
          )}

          {activeTab === "nuevoPuesto" && (
            <div className="space-y-8">
              {/* Sección para Asistente IA */}
              <CreateJobAIForm
                onJobGenerated={(generatedData) => {
                  console.log("Dashboard: Job data generated by AI:", generatedData);
                  setJobPostData(generatedData); // Llenar el estado con datos de IA
                  toast({ title: "Sugerencia de IA generada", description: "Puedes editar los detalles antes de publicar." });
                }}
                setIsLoadingParent={setIsProcessingJob} // Para mostrar estado de carga en el botón de Publicar Puesto
              />

              {/* Sección para Formulario Manual (siempre visible o condicional) */}
              {/* El initialData de CreateJobForm se actualizará cuando jobPostData cambie */}
              <CreateJobForm
                initialData={jobPostData}
                key={jobPostData ? JSON.stringify(jobPostData) : 'empty-form'} // Forzar re-render si initialData cambia
                onPublish={async (jobPayload) => { // onPublish para manejar la lógica de guardado
                  setIsProcessingJob(true);
                  try {
                    const newJob = await cvService.createJobPost(jobPayload); // Usar el servicio
                    console.log("Puesto publicado desde Dashboard:", newJob);
                    
                    // Actualizar el estado local 'jobs' para reflejar el nuevo puesto
                    // Asumiendo que 'newJob' es el objeto devuelto por Supabase con id y created_at
                    setJobs(prevJobs => [newJob, ...prevJobs]);
                    
                    toast({ title: "¡Puesto Publicado!", description: `${newJob.title} ha sido publicado.` });
                    setJobPostData(null); // Limpiar el estado que alimenta el formulario
                    // Opcional: redirigir a la pestaña de puestos publicados
                    setActiveTab("puestosPublicados");
                  } catch (error) {
                    console.error("Error al publicar puesto desde Dashboard:", error);
                    toast({ title: "Error al Publicar", description: `No se pudo publicar el puesto: ${error.message}`, variant: "destructive" });
                  } finally {
                    setIsProcessingJob(false);
                  }
                }}
                isProcessingJob={isProcessingJob}
              />
            </div>
          )}

          {activeTab === "puestosPublicados" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">Puestos de Trabajo Publicados</h2>
                <Button onClick={() => setActiveTab('nuevoPuesto')} variant="outline" size="sm">
                  <Briefcase className="mr-2 h-4 w-4" /> Crear Nuevo
                </Button>
              </div>
              {jobs.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No hay puestos publicados todavía.</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                    <h3 className="text-slate-700 font-semibold">{job.title}</h3>
                    <p className="text-slate-600 text-sm mt-1 line-clamp-3">{job.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "planActual" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Plan Actual</h2>
              <p className="text-slate-600">Aquí se mostrará la información sobre el plan de suscripción actual del usuario.</p>
              {/* Contenido del plan actual */}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
