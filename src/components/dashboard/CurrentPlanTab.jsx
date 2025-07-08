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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
          {/* Columna 1: Plan de Suscripción Mensual/Empresarial/Trial */}
          {basePlan && ( // Mostrar siempre si hay un plan base, activo o no
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Plan de Suscripción: <span className="capitalize text-blue-600">{basePlan.name}</span></h3>
              <div className="space-y-3">
                {!isBasePlanActive && (
                  <p className="text-red-600 font-medium">Este plan está actualmente inactivo o vencido.</p>
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
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Bonos de Búsqueda Puntual</h3>
              {!isBonusPlanActive && (
                <p className="text-red-600 font-medium">Estos bonos están actualmente inactivos o vencidos.</p>
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
          {!(basePlan && basePlan.cvLimit === Infinity && basePlan.jobLimit === Infinity) && (
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">{APP_PLANS['busqueda_puntual'].name}</h3>
              <p className="text-sm text-green-600 font-medium mb-3">¡Aumenta tu límite por única vez!</p>
              <div className="space-y-3">
                <p className="text-md">{APP_PLANS['busqueda_puntual'].description}</p>
                <Button
                  onClick={() => handleCheckout(APP_PLANS['busqueda_puntual'], user)}
                  disabled={loadingCheckout || loadingUser || !user?.id}
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Comprar {APP_PLANS['busqueda_puntual'].priceDisplay}
                </Button>
              </div>
            </div>
          )}

          {/* Columna para Mejorar Plan (siempre visible, a menos que sea Enterprise) */}
          {nextPlanToShow && nextPlanToShow.id !== 'enterprise_monthly' && (
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Mejorar Plan</h3>
              <div className="space-y-3">
                <p className="text-md font-semibold capitalize text-purple-600">{nextPlanToShow.name}</p>
                <p className="text-md">{nextPlanToShow.description}</p>
                <Button
                  onClick={() => handleCheckout(nextPlanToShow, user)}
                  disabled={loadingCheckout || loadingUser || !user?.id}
                  className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Comprar {nextPlanToShow.priceDisplay}
                </Button>
              </div>
            </div>
          )}

          {/* Columna para Contactar a Soporte (si es Enterprise o no hay plan superior) */}
          {(!nextPlanToShow || nextPlanToShow.id === 'enterprise_monthly') && (
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Opciones Enterprise</h3>
              <div className="space-y-3">
                <p className="text-md font-semibold text-slate-500">Para soluciones personalizadas y planes Enterprise, contacta a nuestro equipo de ventas.</p>
                <Button
                  onClick={() => window.location.href = 'mailto:soporte@employsmartia.com'} // Ejemplo de contacto
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Contactar a Soporte
                </Button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <p className="text-slate-500">Cargando información del plan o no hay plan disponible. Si el problema persiste, contacta a soporte.</p>
      )}
      {/* El ToastProvider y Toast ya no son necesarios aquí para el botón "Mejorar Plan" */}
      {/* Se pueden mantener si se usan para otras notificaciones */}
      {/* <ToastProvider>
        <Toast open={open} onOpenChange={setOpen} nextPlan={nextPlan}>
          <ToastTitle>{nextPlan ? nextPlan.name : 'No hay plan superior'}</ToastTitle>
          <ToastDescription>
            {nextPlan ? nextPlan.description : 'Contacta a soporte para más información.'}
          </ToastDescription>
          <Button
            onClick={() => handleCheckout(nextPlan, user)}
            disabled={loadingCheckout}
          >
            {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comprar Plan
          </Button>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider> */}
    </motion.div>
  );
}

export default CurrentPlanTab;
