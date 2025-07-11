import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { APP_PLANS, PLAN_HIERARCHY } from '@/config/plans'; // Añadir PLAN_HIERARCHY
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
  const { userSubscription, effectiveLimits, isBonusPlanActive, bonusCvUsed, bonusJobUsed, bonusMatchUsed, bonusCvTotal, bonusJobTotal, bonusMatchTotal } = useDashboardData(); // Obtener userSubscription y effectiveLimits
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
      {Object.values(APP_PLANS).length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        {Object.values(APP_PLANS)
          .filter(plan => plan.id !== 'trial' && plan.type !== 'enterprise')
          .map((plan, index) => {
          const isCurrentPlan = basePlan && basePlan.id === plan.id;
          const isExpired = isCurrentPlan && !isBasePlanActive && baseSubscription?.current_period_end && new Date(baseSubscription.current_period_end) < new Date();

          let borderColorClass = 'border-slate-200'; // Default border
          let textColorClass = 'text-slate-800'; // Default text color
          let buttonBgClass = 'bg-blue-500 hover:bg-blue-600'; // Default button color
          let buttonText = 'Elegir Plan';
          let buttonAction = () => handleCheckout(plan, user);
          let showButton = true;

          if (isCurrentPlan) {
            borderColorClass = isExpired ? 'border-red-500 ring-2 ring-red-400' : (isBasePlanActive ? 'border-green-500 ring-2 ring-green-400' : 'border-yellow-400 ring-2 ring-yellow-300');
            textColorClass = isExpired ? 'text-red-700' : 'text-yellow-700';
            buttonBgClass = isExpired ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600';
            buttonText = isExpired ? 'Renovar en forma manual' : 'Plan Actual';
            showButton = isExpired; // Solo mostrar botón si está vencido para renovación
          } else if (plan.id === 'busqueda_puntual') {
            buttonBgClass = 'bg-purple-600 hover:bg-purple-700';
            buttonText = 'Comprar Ahora';
          } else if (plan.id === nextPlanToShow?.id) {
            buttonBgClass = 'bg-green-600 hover:bg-green-700';
            buttonText = 'Mejorar Plan';
          } else if (plan.type === 'enterprise') {
            buttonBgClass = 'bg-gray-500 hover:bg-gray-600';
            buttonText = 'Contactar Ventas';
            buttonAction = () => window.location.href = '#contact'; // O una ruta de contacto
          } else if (plan.id === 'trial') {
            buttonBgClass = 'bg-purple-600 hover:bg-purple-700';
            buttonText = 'Empezar Prueba';
            buttonAction = () => window.location.href = '/register';
          }

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl p-6 border shadow-lg flex flex-col relative bg-white ${borderColorClass}`}
            >
              {isCurrentPlan && (
                <div className={`absolute top-0 right-0 text-xs font-bold px-4 py-1 rounded-bl-lg ${isExpired ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'}`}>
                  {isExpired ? 'Vencido' : 'Plan Actual'}
                </div>
              )}
              <h3 className={`text-2xl font-semibold mb-2 text-center ${textColorClass}`}>{plan.name}</h3>
              <p className="text-slate-600 text-sm mb-4 text-center h-16 overflow-hidden">{plan.description}</p>
              <div className="mb-6 text-center">
                <span className="text-3xl font-bold text-slate-800">{plan.priceDisplay}</span>
              </div>

              {isCurrentPlan && baseSubscription && (
                <div className="mb-4 text-sm text-slate-600 text-center">
                  <p>Adquirido: {new Date(baseSubscription.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {baseSubscription.current_period_end && (
                    <p>Vencimiento: {new Date(baseSubscription.current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  )}
                </div>
              )}

              {isCurrentPlan && effectiveLimits && (
                <div className="mb-4 text-sm text-slate-600 text-center">
                  <p className="mt-2 font-semibold">Límites de tu Plan:</p>
                  {effectiveLimits.cvs !== undefined && (
                    <p>CVs: {effectiveLimits.cvs_used} / {effectiveLimits.cvs === -1 ? 'Ilimitados' : effectiveLimits.cvs}</p>
                  )}
                  {effectiveLimits.jobs !== undefined && (
                    <p>Ofertas: {effectiveLimits.jobs_used} / {effectiveLimits.jobs === -1 ? 'Ilimitadas' : effectiveLimits.jobs}</p>
                  )}
                  {effectiveLimits.matches !== undefined && (
                    <p>Matches: {effectiveLimits.matches_used} / {effectiveLimits.matches === -1 ? 'Ilimitados' : effectiveLimits.matches}</p>
                  )}
                </div>
              )}

              {isCurrentPlan && isBonusPlanActive && plan.id === 'busqueda_puntual' && baseSubscription && (
                <div className="mb-4 text-sm text-slate-600 text-center">
                  <h3 className="text-xl font-semibold mb-2 text-center text-green-700">Bonos Puntuales Activos</h3>
                  <p>Adquirido: {new Date(baseSubscription.bonus_periodo_start || baseSubscription.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {baseSubscription.bonus_periodo_end && (
                    <p>Vencimiento: {new Date(baseSubscription.bonus_periodo_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  )}
                  <p className="mt-2 font-semibold">Límites y Uso:</p>
                  {bonusCvTotal > 0 && (
                    <p>CVs: {bonusCvUsed} / {bonusCvTotal}</p>
                  )}
                  {bonusJobTotal > 0 && (
                    <p>Ofertas: {bonusJobUsed} / {bonusJobTotal}</p>
                  )}
                  {bonusMatchTotal > 0 && (
                    <p>Matches: {bonusMatchUsed} / {bonusMatchTotal}</p>
                  )}
                </div>
              )}

              <ul className="space-y-3 text-slate-700 mb-8 flex-grow text-sm">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    {feature.includes('✅') ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    ) : feature.includes('❌') ? (
                      <XCircle className="h-4 w-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" /> // Default check for other features
                    )}
                    <span>{feature.replace('✅', '').replace('❌', '').trim()}</span>
                  </li>
                ))}
              </ul>

              {showButton && (
                <Button
                  size="lg"
                  className={`w-full mt-auto font-semibold py-3 px-6 rounded-lg transition-colors ${buttonBgClass} text-white`}
                  onClick={buttonAction}
                  disabled={loadingCheckout || loadingUser}
                >
                  {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {buttonText}
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
      ) : (
        <p className="text-slate-500">Cargando información del plan o no hay plan disponible. Si el problema persiste, contacta a soporte.</p>
      )}

              <p>Matches: {bonusMatchUsed} / {bonusMatchTotal}</p>

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
