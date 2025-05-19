import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, AlertCircle, ArrowRightCircle } from 'lucide-react'; // Importar AlertCircle y ArrowRightCircle
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx'; // Importar Button
import { Link } from 'react-router-dom'; // Para el botón de actualizar plan
import { extractTextFromFile } from "@/lib/fileProcessing";

const PLAN_CV_ANALYSIS_LIMITS = {
  trial: 10,
  basico: 50,
  business: 1000,
  enterprise: Infinity,
};

const PLAN_HIERARCHY = {
  trial: { next: 'basico', name: 'Básico' },
  basico: { next: 'business', name: 'Business' },
  business: { next: 'enterprise', name: 'Enterprise' },
  enterprise: null, // No hay plan superior
};

function UploadCVTab({
  handleFileUpload,
  fileInputRef,
  isBulkProcessing,
  isProcessing, // Estado general de procesamiento de CV
  totalFilesToUpload,
  filesUploadedCount,
  currentFileProcessingName,
  handleDragOver,
  handleDrop,
}) {
  const { user } = useAuth();

  const planId = user?.suscripcion?.plan_id || 'basico'; // Fallback
  const status = user?.suscripcion?.status;
  const currentAnalysisCount = user?.suscripcion?.cvs_analizados_este_periodo || 0;
  const analysisLimit = PLAN_CV_ANALYSIS_LIMITS[planId] || 0;
  
  const canAnalyzeMore = (status === 'active' || status === 'trialing') && currentAnalysisCount < analysisLimit;
  const limitReached = (status === 'active' || status === 'trialing') && currentAnalysisCount >= analysisLimit;

  const handleZoneClick = () => {
    if (!canAnalyzeMore || isBulkProcessing || isProcessing) {
      return;
    }
    fileInputRef.current?.click();
  };

  const nextPlanDetails = PLAN_HIERARCHY[planId];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Cargar nuevo CV</h2>
      
      {/* Información de Uso y Límite */}
      {user?.suscripcion && (status === 'active' || status === 'trialing') && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p>
            CVs analizados este período: <strong className="font-semibold">{currentAnalysisCount}</strong> de <strong className="font-semibold">{analysisLimit === Infinity ? 'Ilimitados' : analysisLimit}</strong>
          </p>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${analysisLimit === Infinity ? 100 : (currentAnalysisCount / analysisLimit) * 100}%` }}
            ></div>
          </div>
          {nextPlanDetails && limitReached && (
            <Link to="/#pricing" className="mt-3 inline-block">
              <Button variant="outline" size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500">
                Actualizar a Plan {nextPlanDetails.name}
                <ArrowRightCircle className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
           {planId === 'enterprise' && limitReached && ( // Aunque enterprise es ilimitado, por si acaso
             <p className="mt-3 text-sm">Has alcanzado el límite de tu plan Enterprise (esto no debería suceder).</p>
           )}
        </div>
      )}

      {limitReached && (status === 'active' || status === 'trialing') && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Has alcanzado tu límite mensual de <strong className="font-semibold">{analysisLimit === Infinity ? 'Ilimitados' : analysisLimit}</strong> análisis de CVs para tu plan <strong className="font-semibold capitalize">{planId}</strong>.
                {nextPlanDetails ? (
                  <> Para analizar más CVs, por favor considera <Link to="/#pricing" className="underline hover:text-yellow-600 font-semibold">actualizar tu plan a {nextPlanDetails.name}</Link> o espera al próximo ciclo.</>
                ) : (
                  " Por favor, contacta a ventas si necesitas más capacidad."
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      {!(status === 'active' || status === 'trialing') && user?.suscripcion && (
         <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Tu suscripción actual (<strong className="font-semibold capitalize">{status || 'desconocido'}</strong>) no te permite analizar nuevos CVs.
                Por favor, <Link to="/#pricing" className="underline hover:text-red-600 font-semibold">revisa tu plan</Link> o contacta a soporte.
              </p>
            </div>
          </div>
        </div>
       )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-colors bg-gray-50
                    ${(!canAnalyzeMore || isBulkProcessing || isProcessing)
                      ? 'border-gray-300 cursor-not-allowed opacity-60'  // Aumentar opacidad para deshabilitado
                      : 'border-gray-300 hover:border-blue-500 cursor-pointer'}`}
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          onChange={async (e) => {
            handleFileUpload(e);
            const file = e.target.files[0];
            if (file) {
              const text = await extractTextFromFile(file);
              console.log("Texto extraído del CV:", text);
            }
          }}
          className="hidden"
          ref={fileInputRef}
          disabled={!canAnalyzeMore || isBulkProcessing || isProcessing}
        />
        <FileUp className={`mx-auto h-12 w-12 mb-4 ${(!canAnalyzeMore || isBulkProcessing || isProcessing) ? 'text-gray-300' : 'text-gray-400'}`} />
        <p className={`font-medium text-base md:text-lg mb-1 ${(!canAnalyzeMore || isBulkProcessing || isProcessing) ? 'text-slate-400' : 'text-slate-700'}`}>
          Arrastra y suelta tus CVs aquí, o haz clic para seleccionar
        </p>
        <p className="text-xs text-slate-500">
          Formatos aceptados: PDF, DOC, DOCX. Puedes seleccionar múltiples archivos.
        </p>
        {isProcessing && !isBulkProcessing && <p className="mt-4 text-blue-600">Procesando CV individual...</p>}
      </div>
      {isBulkProcessing && (
        <div className="mt-6 w-full">
          <p className="text-sm text-slate-700 mb-1 text-center">
            Procesando lote: {currentFileProcessingName ? `Analizando ${currentFileProcessingName}...` : 'Iniciando...'}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="bg-blue-600 h-6 rounded-full text-xs font-medium text-blue-100 text-center p-1 leading-none transition-all duration-300 ease-in-out"
              style={{ width: totalFilesToUpload > 0 ? `${(filesUploadedCount / totalFilesToUpload) * 100}%` : '0%' }}
            >
              {totalFilesToUpload > 0 ? `${filesUploadedCount} / ${totalFilesToUpload}` : ''}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default UploadCVTab;