import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { APP_PLANS, PLAN_HIERARCHY } from '@/config/plans'; // Añadir PLAN_HIERARCHY
import { Loader2 } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
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
  const { userSubscription } = user || {}; // Obtener userSubscription del usuario
  const { loadingCheckout, handleCheckout } = usePayment();

  // Declarar el estado para controlar la visibilidad del Toast
  const [open, setOpen] = useState(false);

  const currentPlanId = userSubscription?.plan_id;
  const currentPlan = APP_PLANS[currentPlanId] || null;

  const busquedaPuntualPlan = APP_PLANS['busqueda_puntual'];

  // Determinar el siguiente plan en la jerarquía si no es enterprise
  // Determinar el siguiente plan para mejora
  let nextPlanToShow = null;
  if (currentPlanId === 'busqueda_puntual') {
      nextPlanToShow = APP_PLANS['profesional_monthly'];
  } else {
      const nextPlanId = PLAN_HIERARCHY[currentPlanId]?.next || null;
      nextPlanToShow = nextPlanId ? APP_PLANS[nextPlanId] : null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Detalles de tu Plan</h2>
      {user && user.suscripcion ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
          {/* Columna 1: Plan Actual */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Tu Plan Actual</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Plan Contratado:</p>
                <p className="text-xl font-semibold capitalize text-blue-600">{user.suscripcion.plan_id || "No disponible"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Estado:</p>
                <p className="text-lg capitalize">{user.suscripcion.status || "No disponible"}</p>
              </div>
              {user.suscripcion.status === 'trialing' && user.suscripcion.trial_ends_at && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Tu prueba gratuita finaliza el:</p>
                  <p className="text-lg">{new Date(user.suscripcion.trial_ends_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}
              {user.suscripcion.status === 'active' && user.suscripcion.current_period_end && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Próxima fecha de renovación:</p>
                  <p className="text-lg">{new Date(user.suscripcion.current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}
              {/* Puedes añadir más detalles del plan actual aquí si es necesario */}
            </div>
          </div>

          {/* Columna 2: Plan Búsqueda Puntual */}
          {busquedaPuntualPlan && (
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">{busquedaPuntualPlan.name}</h3>
              <p className="text-sm text-green-600 font-medium mb-3">¡Aumenta tu límite por única vez!</p>
              <div className="space-y-3">
                <p className="text-md">{busquedaPuntualPlan.description}</p>
                {/* Puedes añadir más detalles del plan Búsqueda Puntual aquí */}
                <Button
                  onClick={() => handleCheckout(busquedaPuntualPlan, user)}
                  disabled={loadingCheckout || loadingUser || !user?.id} // Deshabilitar si está cargando el checkout, el usuario, o si user.id no está disponible
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Comprar {busquedaPuntualPlan.price} {busquedaPuntualPlan.currency}
                </Button>
              </div>
            </div>
          )}

          {/* Columna 3: Siguiente Plan Jerárquico */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Mejorar Plan</h3>
            {nextPlanToShow ? (
              <div className="space-y-3">
                <p className="text-md font-semibold capitalize text-purple-600">{nextPlanToShow.name}</p>
                <p className="text-md">{nextPlanToShow.description}</p>
                {/* Puedes añadir más detalles del siguiente plan aquí */}
                <Button
                  onClick={() => handleCheckout(nextPlanToShow, user)}
                  disabled={loadingCheckout || loadingUser || !user?.id} // Deshabilitar si está cargando el checkout, el usuario, o si user.id no está disponible
                  className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Comprar {nextPlanToShow.price} {nextPlanToShow.currency}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-md font-semibold text-slate-500">No hay un plan superior definido.</p>
                <p className="text-md text-slate-500">Contacta a soporte para opciones empresariales.</p>
                {/* Puedes añadir un botón de contacto a soporte aquí si es necesario */}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-slate-500">No se pudo cargar la información de tu plan. Si el problema persiste, contacta a soporte.</p>
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
