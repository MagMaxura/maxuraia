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
  const { user } = useAuth();
  const { userSubscription } = user || {}; // Obtener userSubscription del usuario
  const { loadingCheckout, handleCheckout } = usePayment();

  const currentPlanId = userSubscription?.plan_id;
  const currentPlan = APP_PLANS[currentPlanId] || null;

  const busquedaPuntualPlan = APP_PLANS['busqueda_puntual'];

  // Determinar el siguiente plan en la jerarquía si no es enterprise
  const nextPlanId = PLAN_HIERARCHY[currentPlanId]?.next || null;
  const nextPlan = nextPlanId ? APP_PLANS[nextPlanId] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-xl shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Detalles de tu Plan</h2>
      {user && user.suscripcion ? (
        <div className="space-y-5 text-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-500">Plan Contratado:</p>
            <div className="flex items-center space-x-4">
              <p className="text-xl font-semibold capitalize text-blue-600">{user.suscripcion.plan_id || "No disponible"}</p>
              <Button onClick={() => setOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Mejorar Plan
              </Button>
            </div>
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
        </div>
      ) : (
        <p className="text-slate-500">No se pudo cargar la información de tu plan. Si el problema persiste, contacta a soporte.</p>
      )}
      <ToastProvider>
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
      </ToastProvider>
    </motion.div>
  );
}

export default CurrentPlanTab;
