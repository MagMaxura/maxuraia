import React, { useState, useRef, useEffect } from "react"; // Añadir useEffect aquí
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, Users, Briefcase, LogOut, FileText, CreditCard, FileUp } from "lucide-react"; // Añadido FileText, CreditCard, FileUp
import { useToast } from "@/components/ui/use-toast";
import { extractTextFromFile, analyzeCV } from "@/lib/fileProcessing";
import CVAnalysis from "@/components/CVAnalysis";
import CreateJobForm from "@/components/CreateJobForm.jsx";
import CreateJobAIForm from "@/components/CreateJobAIForm.jsx";
import { cvService } from "@/services/cvService.js";
import UploadCVTab from "@/components/dashboard/UploadCVTab.jsx";
import ProcessedCVsTab from "@/components/dashboard/ProcessedCVsTab.jsx";
import CurrentPlanTab from "@/components/dashboard/CurrentPlanTab.jsx";
import CreateNewJobTab from "@/components/dashboard/CreateNewJobTab.jsx";
import PublishedJobsTab from "@/components/dashboard/PublishedJobsTab.jsx"; // Importar el nuevo componente

function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cargarNuevoCV"); // Pestaña inicial
  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [cvAnalysis, setCvAnalysis] = useState(null);
  // Estados para el procesamiento de CVs (individual y masivo)
  const [isProcessing, setIsProcessing] = useState(false); // Para el estado general de "procesando algo"
  const [isBulkProcessing, setIsBulkProcessing] = useState(false); // Específico para carga masiva
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [filesUploadedCount, setFilesUploadedCount] = useState(0);
  const [currentFileProcessingName, setCurrentFileProcessingName] = useState("");

  // isProcessingJob y jobPostData se mueven a CreateNewJobTab.jsx
  // const [isProcessingJob, setIsProcessingJob] = useState(false);
  // const [jobPostData, setJobPostData] = useState(null);
  const fileInputRef = useRef(null);
  const [isLoadingCVs, setIsLoadingCVs] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Estados para los filtros de CVs
  const [cvFilters, setCvFilters] = useState({
    ageMin: '',
    ageMax: '',
    title: '', // Para nivel_escolarizacion
    experienceKeywords: '',
    skills: '', // String de habilidades separadas por coma
    location: '',
  });

  // Cargar CVs y Puestos guardados cuando el componente se monta y el usuario está disponible
  useEffect(() => {
    if (user?.id) {
      const fetchUserCVs = async () => {
        console.log("Dashboard: Fetching CVs for recruiterId:", user.id);
        setIsLoadingCVs(true);
        try {
          const fetchedCVs = await cvService.getCVsByRecruiterId(user.id);
          console.log("Dashboard: Fetched CVs from DB:", fetchedCVs);
          
          // Mapear los datos de la BD al formato esperado por el estado cvFiles
          const formattedCVs = fetchedCVs.map(dbCv => {
            // El análisis completo está en 'analysis_result'
            // El 'textoCompleto' del CV está en 'content'
            // El candidato asociado está en 'candidatos' (si existe y es un objeto)
            let analysisData = dbCv.analysis_result || {};
            if (dbCv.content && (!analysisData.textoCompleto || analysisData.textoCompleto.trim() === '')) {
              analysisData.textoCompleto = dbCv.content;
            }
            
            // Asegurar que 'habilidades' en analysisData sea el objeto {tecnicas, blandas}
            // Si 'skills' del candidato es un array, lo dividimos heurísticamente o lo ponemos todo en técnicas.
            // Esto es una simplificación; idealmente, analysis_result ya tendría la estructura correcta.
            if (dbCv.candidatos && Array.isArray(dbCv.candidatos.skills) && (!analysisData.habilidades || typeof analysisData.habilidades !== 'object')) {
              analysisData.habilidades = {
                tecnicas: dbCv.candidatos.skills, // Poner todo en técnicas por defecto
                blandas: []
              };
            } else if (analysisData.habilidades && !analysisData.habilidades.tecnicas && !analysisData.habilidades.blandas && Array.isArray(analysisData.habilidades)) {
              // Si analysis.habilidades es un array simple (formato antiguo)
               analysisData.habilidades = { tecnicas: analysisData.habilidades, blandas: [] };
            }


            return {
              name: dbCv.file_name || `CV ${dbCv.id}`,
              originalFile: null, // No tenemos el objeto File original, pero podríamos tener file_path o file_url
              analysis: analysisData,
              uploadedDate: new Date(dbCv.created_at),
              cv_database_id: dbCv.id,
              candidate_database_id: dbCv.candidatos?.id || null, // Asumiendo que candidatos es un objeto o null
            };
          });
          
          setCvFiles(formattedCVs);
          if (formattedCVs.length > 0) {
            // Opcional: seleccionar el primer CV de la lista cargada
            // setSelectedCV(0);
            // setCvAnalysis(formattedCVs[0].analysis);
          }
        } catch (error) {
          console.error("Dashboard: Error fetching user CVs:", error);
          toast({ title: "Error al cargar CVs", description: "No se pudieron cargar tus CVs guardados.", variant: "destructive" });
        } finally {
          setIsLoadingCVs(false);
        }
      };
      fetchUserCVs();

      const fetchUserJobs = async () => {
        console.log("Dashboard: Fetching Jobs for recruiterId:", user.id);
        setIsLoadingJobs(true);
        try {
          const fetchedJobs = await cvService.getJobsByRecruiterId(user.id);
          console.log("Dashboard: Fetched Jobs from DB:", fetchedJobs);
          setJobs(fetchedJobs || []);
        } catch (error) {
          console.error("Dashboard: Error fetching user Jobs:", error);
          toast({ title: "Error al cargar Puestos", description: "No se pudieron cargar tus puestos de trabajo guardados.", variant: "destructive" });
        } finally {
          setIsLoadingJobs(false);
        }
      };
      fetchUserJobs();

    } else {
      setCvFiles([]);
      setJobs([]); // Limpiar Puestos si no hay usuario
      setIsLoadingCVs(false);
      setIsLoadingJobs(false);
    }
  }, [user?.id]); // Cambiar dependencia a user?.id (o solo user si prefieres el objeto completo)


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
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setIsBulkProcessing(true);
    setIsProcessing(true); // Estado general de procesamiento
    setTotalFilesToUpload(selectedFiles.length);
    setFilesUploadedCount(0);
    setCurrentFileProcessingName("");

    let anyErrorOccurred = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentFileProcessingName(file.name);
      setFilesUploadedCount(i); // Actualizar contador antes de procesar el actual

      try {
        console.log(`Dashboard: Procesando archivo ${i + 1}/${selectedFiles.length}: ${file.name}`);
        const text = await extractTextFromFile(file);
        const resolvedAnalysis = await analyzeCV(text);
        console.log(`Dashboard: Análisis resuelto para ${file.name}`, resolvedAnalysis);

        const newCvFile = {
          name: resolvedAnalysis.nombre || file.name, // Usar nombre del candidato, fallback al nombre del archivo
          originalFile: file,
          analysis: resolvedAnalysis,
          uploadedDate: new Date(),
          cv_database_id: null,
          candidate_database_id: null,
        };

        // Actualizar estado de forma funcional para asegurar la última versión
        setCvFiles(prevCvFiles => [...prevCvFiles, newCvFile]);
        
        // Seleccionar y mostrar el último CV procesado si es el único o el primero de un lote
        if (selectedFiles.length === 1 || i === selectedFiles.length -1 ) {
            setSelectedCV(cvFiles.length + i); // Ajustar índice basado en el estado actual + procesados
            setCvAnalysis(resolvedAnalysis);
        }


        toast({
          title: "CV Procesado",
          description: `${file.name} ha sido analizado correctamente. (${i + 1}/${selectedFiles.length})`,
        });
      } catch (error) {
        anyErrorOccurred = true;
        console.error(`Error procesando CV ${file.name}:`, error);
        toast({
          title: `Error al procesar ${file.name}`,
          description: `No se pudo procesar el archivo. Asegúrate de que sea un PDF, DOC o DOCX válido. (${i + 1}/${selectedFiles.length})`,
          variant: "destructive",
        });
        // Continuar con el siguiente archivo si uno falla
      }
    }
    setFilesUploadedCount(selectedFiles.length); // Marcar todos como "intentados"
    setIsBulkProcessing(false);
    setIsProcessing(false);
    setCurrentFileProcessingName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Resetear el input
    }

    if (!anyErrorOccurred && selectedFiles.length > 0) {
      setActiveTab("cvsProcesados");
    } else if (selectedFiles.length > 0) {
        // Si hubo errores, quizás quedarse en la pestaña de carga o ir a procesados
        // dependiendo de si alguno tuvo éxito.
        // Si al menos uno tuvo éxito, ir a procesados.
        if (cvFiles.length > (cvFiles.length - selectedFiles.length + (selectedFiles.filter(f => f !== null)).length) ) { // una heurística
             setActiveTab("cvsProcesados");
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

  const handleDeleteCV = async (cvDatabaseIdToDelete) => {
    if (!cvDatabaseIdToDelete) {
      toast({ title: "Error", description: "No se proporcionó ID para eliminar el CV.", variant: "destructive" });
      return;
    }
    console.log("Dashboard: Intentando eliminar CV con ID de BD:", cvDatabaseIdToDelete);
    try {
      await cvService.deleteCV(cvDatabaseIdToDelete);
      toast({ title: "CV Eliminado", description: "El CV y los datos asociados han sido eliminados." });

      const updatedCvFiles = cvFiles.filter(cv => cv.cv_database_id !== cvDatabaseIdToDelete);
      setCvFiles(updatedCvFiles);
      
      const currentSelectedCv = cvFiles[selectedCV];
      if (currentSelectedCv && currentSelectedCv.cv_database_id === cvDatabaseIdToDelete) {
        setSelectedCV(null);
        setCvAnalysis(null);
      } else if (selectedCV !== null) {
        if (selectedCV >= updatedCvFiles.length) {
            setSelectedCV(null);
            setCvAnalysis(null);
        }
      }
    } catch (error) {
      console.error("Dashboard: Error al eliminar CV:", error);
      toast({ title: "Error al Eliminar", description: `No se pudo eliminar el CV: ${error.message}`, variant: "destructive" });
    }
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
            <UploadCVTab
              handleFileUpload={handleFileUpload}
              fileInputRef={fileInputRef}
              isBulkProcessing={isBulkProcessing}
              isProcessing={isProcessing}
              totalFilesToUpload={totalFilesToUpload}
              filesUploadedCount={filesUploadedCount}
              currentFileProcessingName={currentFileProcessingName}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
            />
          )}

          {activeTab === "cvsProcesados" && (
            <ProcessedCVsTab
              cvFiles={cvFiles}
              selectedCV={selectedCV}
              handleCVClick={handleCVClick}
              cvAnalysis={cvAnalysis}
              isLoadingCVs={isLoadingCVs}
              isProcessing={isProcessing}
              userId={user?.id}
              onSaveSuccess={handleSaveSuccess}
              onDeleteCV={handleDeleteCV} // Pasar la función de eliminar
              // Pasar props de filtros
              cvFilters={cvFilters}
              onCvFilterChange={setCvFilters}
            />
          )}

          {activeTab === "nuevoPuesto" && (
            <CreateNewJobTab
              setActiveTab={setActiveTab}
              // Si CreateNewJobTab necesita actualizar la lista de 'jobs' en Dashboard,
              // se necesitaría una función onJobPublished pasada como prop.
              // Por ahora, CreateNewJobTab maneja la redirección y Dashboard recargará los jobs
              // la próxima vez que se monte o si user.id cambia.
              // Para una actualización inmediata de la lista de jobs en Dashboard,
              // se podría pasar una función como:
              // onJobPublished={(newJob) => setJobs(prevJobs => [newJob, ...prevJobs])}
            />
          )}

          {activeTab === "puestosPublicados" && (
            <PublishedJobsTab
              jobs={jobs}
              isLoadingJobs={isLoadingJobs}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "planActual" && (
            <CurrentPlanTab />
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
