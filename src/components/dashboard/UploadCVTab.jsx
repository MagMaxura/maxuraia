import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, AlertCircle, ArrowRightCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Link } from 'react-router-dom';
import { extractTextFromFile } from "@/lib/fileProcessing";
import { APP_PLANS, PLAN_HIERARCHY } from '@/config/plans'; // Importar desde el archivo central
import { useDashboardData } from '@/hooks/useDashboardData'; // Importar useDashboardData

function UploadCVTab({
  handleFileUpload,
  fileInputRef,
  isBulkProcessing,
  isProcessing,
  totalFilesToUpload,
  filesUploadedCount,
  currentFileProcessingName,
  handleDragOver,
  handleDrop,
  userSubscription, // Recibir prop
  analysisLimit, // Recibir prop
  currentAnalysisCount, // Recibir prop
  optimisticCurrentAnalysisCount, // Nueva prop: contador optimista
  effectiveLimits, // Nuevo: Recibir prop
  isBonusPlanActive,
  bonusCvUsed,
  bonusCvTotal,
  bonusJobUsed,
  bonusJobTotal,
  bonusMatchUsed,
  bonusMatchTotal,
  onCvUploadSuccess, // Nueva prop: callback para éxito de subida de CV
  // isLoadingSubscription, // Si useDashboardData devolviera un estado de carga específico para la suscripción
}) {
  const { user } = useAuth();
  const { isBasePlanActive, basePlan } = useDashboardData(); // Obtener directamente del hook

  // Usar las props directamente, con fallbacks seguros
  const planId = effectiveLimits?.effectiveCurrentPlan?.id || userSubscription?.plan_id || 'basico';
  const displayAnalysisLimit = analysisLimit === Infinity ? 'Ilimitados' : analysisLimit;
  // Usar el contador optimista si está disponible, de lo contrario, el de la base de datos
  const displayCurrentAnalysisCount = optimisticCurrentAnalysisCount !== undefined ? optimisticCurrentAnalysisCount : (currentAnalysisCount || 0);

  // Determinar si el usuario puede analizar más CVs
  const canAnalyzeMore = effectiveLimits.isSubscriptionActive && displayCurrentAnalysisCount < analysisLimit;

  // Determinar si se ha alcanzado el límite
  const limitReached = effectiveLimits.isSubscriptionActive && displayCurrentAnalysisCount >= analysisLimit;

  const handleZoneClick = () => {
    if (!canAnalyzeMore || isBulkProcessing || isProcessing) {
      return;
    }
    fileInputRef.current?.click();
  };

  const nextPlanDetails = PLAN_HIERARCHY[planId];
  
  // Mostrar un estado de carga si la suscripción aún no está disponible
  if (!userSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-xl shadow-xl text-center text-slate-600"
      >
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Cargar nuevo CV</h2>
        <p>Cargando información de tu plan...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Cargar nuevo CV</h2>
      
      {/* Mensaje de Plan Mensual Vencido */}
      {!isBasePlanActive && basePlan && (basePlan.type === 'monthly' || basePlan.type === 'enterprise') && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Tu plan mensual <strong className="font-semibold capitalize">{basePlan.name}</strong> ha expirado. Aunque tengas bonos puntuales activos, te recomendamos <Link to="/#pricing" className="underline hover:text-red-600 font-semibold">renovar tu suscripción</Link> para mantener todas las funcionalidades.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información de Uso y Límite */}
      {effectiveLimits.isSubscriptionActive && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-semibold mb-2">Tu Plan Actual: <span className="capitalize">{effectiveLimits?.effectiveCurrentPlan?.name || APP_PLANS[planId]?.name || planId}</span></p>
          {/* Mostrar el uso de CVs del plan base si está activo, de lo contrario, mostrar los bonos */}
              <p>
                CVs cargados este período: <strong className="font-semibold">{effectiveLimits.cvs_used}</strong> de <strong className="font-semibold">{effectiveLimits.cvLimit === Infinity ? 'Ilimitados' : effectiveLimits.cvLimit}</strong>
                {effectiveLimits.periodEndsAt && (
                  <> Vencen el: <strong className="font-semibold">{new Date(effectiveLimits.periodEndsAt).toLocaleDateString()}</strong></>
                )}
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${effectiveLimits.cvLimit === Infinity || effectiveLimits.cvLimit === 0 ? 100 : (effectiveLimits.cvs_used / effectiveLimits.cvLimit) * 100}%` }}
                ></div>
              </div>
              {effectiveLimits.cvLimit !== Infinity && effectiveLimits.cvs_used >= effectiveLimits.cvLimit && (
                <Link to="/#pricing" className="mt-3 inline-block">
                  <Button variant="outline" size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500">
                    Actualizar Plan
                    <ArrowRightCircle className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
        </div>
      )}


      {limitReached && effectiveLimits.isSubscriptionActive && (
       <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
         <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Has alcanzado tu límite de <strong className="font-semibold">{displayAnalysisLimit}</strong> análisis de CVs para tu plan <strong className="font-semibold capitalize">{effectiveLimits?.effectiveCurrentPlan?.name || APP_PLANS[planId]?.name || planId}</strong>.
                {nextPlanDetails ? (
                  <> Para analizar más CVs, por favor considera <Link to="/#pricing" className="underline hover:text-yellow-600 font-semibold">actualizar tu plan a {nextPlanDetails.name}</Link>.</>
                ) : (
                  " Por favor, contacta a ventas si necesitas más capacidad."
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      {!effectiveLimits.isSubscriptionActive && user?.suscripcion && (
         <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Tu suscripción actual (<strong className="font-semibold capitalize">{effectiveLimits?.effectiveCurrentPlan?.name || userSubscription?.plan_id || 'desconocido'}</strong>) no te permite analizar nuevos CVs.
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
              console.debug("Texto extraído del CV:", text);
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