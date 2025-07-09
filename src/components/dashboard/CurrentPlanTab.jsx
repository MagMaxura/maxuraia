import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { APP_PLANS, PLAN_HIERARCHY } from '@/config/plans'; // Añadir PLAN_HIERARCHY
import { Loader2 } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { useDashboardData } from '@/hooks/useDashboardData'; // Importar useDashboardData
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

function CurrentPlanTab() {
  const { user, loading: loadingUser } = useAuth(); // Obtener loading del hook useAuth
  const { userSubscription, effectiveLimits } = useDashboardData(); // Obtener userSubscription y effectiveLimits
  const { loadingCheckout, handleCheckout } = usePayment();

  // Declarar el estado para controlar la visibilidad del Toast
  const [open, setOpen] = useState(false);

  const baseSubscription = user?.suscripcion;
  const basePlan = APP_PLANS[baseSubscription?.plan_id] || null;

  // Determinar si el plan base (mensual/empresarial/trial) está activo
  const isBasePlanActive = basePlan &&
                           baseSubscription?.status === 'active' &&
                           baseSubscription?.current_period_end &&
                           new Date(baseSubscription.current_period_end) > new Date();

  // Determinar si los bonos puntuales están activos
  const isBonusPlanActive = (baseSubscription?.one_time_cv_bonus > 0 ||
                             baseSubscription?.one_time_job_bonus > 0 ||
                             baseSubscription?.one_time_match_bonus > 0) &&
                            baseSubscription?.bonus_periodo_start &&
                            baseSubscription?.bonus_periodo_end &&
                            new Date(baseSubscription.bonus_periodo_start) <= new Date() &&
                            new Date(baseSubscription.bonus_periodo_end) >= new Date();

  // Determinar el siguiente plan en la jerarquía para mejora
  let nextPlanToShow = null;
  if (basePlan?.id === 'busqueda_puntual') {
      nextPlanToShow = APP_PLANS['profesional_monthly'];
  } else if (basePlan) {
      const nextPlanId = PLAN_HIERARCHY[basePlan.id]?.next || null;
      nextPlanToShow = nextPlanId ? APP_PLANS[nextPlanId] : null;
  } else {
      // Si no hay plan base, sugerir el plan profesional como siguiente
      nextPlanToShow = APP_PLANS['profesional_monthly'];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Detalles de tu Plan</h2>
      {user && baseSubscription ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
            {/* Columna 1: Plan de Suscripción Mensual/Empresarial/Trial */}
            {basePlan && ( // Mostrar siempre si hay un plan base, activo o no
              <div className={`p-4 rounded-lg ${isBasePlanActive ? 'border-2 border-blue-500 shadow-md' : 'border border-red-500'}`}>
                <h3 className="text-lg font-semibold mb-1 text-center">
                  Plan de Suscripción Mensual
                </h3>
                <p className="text-xl font-bold text-blue-600 text-center capitalize mb-3">
                  {basePlan.name}
                  {isBasePlanActive && <span className="ml-2 text-blue-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>}
                </p>
                <div className="space-y-3">
                  {!isBasePlanActive && (
                    <p className="text-red-600 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Este plan está actualmente inactivo o vencido.
                    </p>
                  )}
                  {!isBasePlanActive && baseSubscription?.current_period_end && new Date(baseSubscription.current_period_end) < new Date() && (
                    <div className="mt-4 text-center">
                      <p className="text-orange-600 font-medium mb-2">
                        El plan no se ha renovado de forma automática.
                      </p>
                      <Button
                        onClick={() => handleCheckout(basePlan, user)} // Asumiendo que basePlan es el plan a renovar
                        disabled={loadingCheckout}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Renovar en forma manual
                      </Button>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de CVs (mensual):</p>
                    <p className="text-lg">{basePlan.cvLimit === Infinity ? "Ilimitados" : basePlan.cvLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de Puestos (mensual):</p>
                    <p className="text-lg">{basePlan.jobLimit === Infinity ? "Ilimitados" : basePlan.jobLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de Matches (mensual):</p>
                    <p className="text-lg">{basePlan.matchLimit === Infinity ? "Ilimitados" : basePlan.matchLimit}</p>
                  </div>
                  {baseSubscription.trial_ends_at && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Tu prueba gratuita finaliza el:</p>
                      <p className="text-lg">{new Date(baseSubscription.trial_ends_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  )}
                  {baseSubscription.current_period_end && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Próxima fecha de renovación:</p>
                      <p className="text-lg">{new Date(baseSubscription.current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Columna para Bonos Puntuales */}
            {(baseSubscription.one_time_cv_bonus > 0 || baseSubscription.one_time_job_bonus > 0 || baseSubscription.one_time_match_bonus > 0) && ( // Mostrar si hay bonos, activos o no
              <div className={`p-4 rounded-lg ${isBonusPlanActive ? 'border-2 border-green-500 shadow-md' : 'border border-red-500'}`}>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  Bonos de Búsqueda Puntual
                  {isBonusPlanActive && <span className="ml-2 text-green-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>}
                </h3>
                {!isBonusPlanActive && (
                  <p className="text-red-600 font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Estos bonos están actualmente inactivos o vencidos.
                  </p>
                )}
                <p className="text-sm text-green-600 font-medium mb-3">¡Límites adicionales por única vez!</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">CVs adicionales:</p>
                    <p className="text-lg">{baseSubscription.one_time_cv_bonus || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Puestos adicionales:</p>
                    <p className="text-lg">{baseSubscription.one_time_job_bonus || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Matches adicionales:</p>
                    <p className="text-lg">{baseSubscription.one_time_match_bonus || 0}</p>
                  </div>
                  {baseSubscription.bonus_periodo_end && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Vencimiento de bonos:</p>
                      <p className="text-lg">{new Date(baseSubscription.bonus_periodo_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Columna para Límites Efectivos Totales (solo si hay algún plan activo) */}
            {(effectiveLimits?.isSubscriptionActive) && (
              <div className="border p-4 rounded-lg bg-blue-50">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">Tus Límites Totales Actuales</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de CVs:</p>
                    <p className="text-xl font-bold text-blue-800">{effectiveLimits?.cvLimit === Infinity ? "Ilimitados" : effectiveLimits?.cvLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de Puestos:</p>
                    <p className="text-xl font-bold text-blue-800">{effectiveLimits?.jobLimit === Infinity ? "Ilimitados" : effectiveLimits?.jobLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de Matches:</p>
                    <p className="text-xl font-bold text-blue-800">{effectiveLimits?.matchLimit === Infinity ? "Ilimitados" : effectiveLimits?.matchLimit}</p>
                  </div>
                  {effectiveLimits?.periodEndsAt && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Vencimiento del plan principal:</p>
                      <p className="text-lg">{new Date(effectiveLimits.periodEndsAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Columna para Comprar Búsqueda Puntual (siempre visible, a menos que el plan base sea ilimitado) */}
            {/* Columna para Comprar Búsqueda Puntual (siempre visible) */}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-700">
            {/* Columna para Comprar Búsqueda Puntual */}
            <div className="p-4 rounded-lg border border-purple-300 bg-purple-50">
              <h3 className="text-lg font-semibold mb-3 text-purple-700 text-center">Comprar Búsqueda Puntual</h3>
              <p className="text-center text-sm text-slate-600 mb-4">Adquiere límites adicionales por única vez, sin suscripción.</p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">CVs:</p>
                  <p className="text-lg">{APP_PLANS['busqueda_puntual'].cvLimit}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Puestos:</p>
                  <p className="text-lg">{APP_PLANS['busqueda_puntual'].jobLimit}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Matches:</p>
                  <p className="text-lg">{APP_PLANS['busqueda_puntual'].matchLimit}</p>
                </div>
              </div>
              <Button
                onClick={() => handleCheckout(APP_PLANS['busqueda_puntual'], user)}
                disabled={loadingCheckout}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Comprar Ahora
              </Button>
            </div>

            {/* Columna para Mejorar Plan Mensual */}
            {nextPlanToShow && (
              <div className="p-4 rounded-lg border border-green-300 bg-green-50">
                <h3 className="text-lg font-semibold mb-3 text-green-700 text-center">Mejorar tu Plan Mensual</h3>
                <p className="text-center text-sm text-slate-600 mb-4">Pasa al siguiente nivel con más límites y beneficios.</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Próximo Plan:</p>
                    <p className="text-lg font-bold text-green-800 capitalize">{nextPlanToShow.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de CVs:</p>
                    <p className="text-lg">{nextPlanToShow.cvLimit === Infinity ? "Ilimitados" : nextPlanToShow.cvLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de Puestos:</p>
                    <p className="text-lg">{nextPlanToShow.jobLimit === Infinity ? "Ilimitados" : nextPlanToShow.jobLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Límite de Matches:</p>
                    <p className="text-lg">{nextPlanToShow.matchLimit === Infinity ? "Ilimitados" : nextPlanToShow.matchLimit}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCheckout(nextPlanToShow, user)}
                  disabled={loadingCheckout}
                  className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mejorar Plan
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-slate-500">Cargando información del plan o no hay plan disponible. Si el problema persiste, contacta a soporte.</p>
      )}
      {/* El ToastProvider y Toast ya no son necesarios aquí para el botón "Mejorar Plan" */}
      {/* Se pueden mantener si se usan para otras notificaciones */}
<ToastProvider>
        <Toast open={open} onOpenChange={setOpen} nextPlan={nextPlanToShow}>
          <ToastTitle>{nextPlanToShow ? nextPlanToShow.name : 'No hay plan superior'}</ToastTitle>
          <ToastDescription>
            {nextPlanToShow ? nextPlanToShow.description : 'Contacta a soporte para más información.'}
          </ToastDescription>
          <Button
            onClick={() => handleCheckout(nextPlanToShow, user)}
            disabled={loadingCheckout}
          >
            {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comprar Plan
          </Button>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </motion.div>
  );
}

export default CurrentPlanTab;
