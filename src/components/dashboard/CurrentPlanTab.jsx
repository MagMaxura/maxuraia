import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { getPlanById, APP_PLANS } from '@/config/plans';
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
  const [open, setOpen] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const getNextPlan = (currentPlanId) => {
    const plans = Object.keys(APP_PLANS);
    const currentPlanIndex = plans.indexOf(currentPlanId);
      const plans = Object.keys(APP_PLANS);
      const currentPlanIndex = plans.indexOf(currentPlanId);
      if (currentPlanIndex < plans.length - 1) {
        return APP_PLANS[plans[currentPlanIndex + 1]];
      return null;
    };

  const handleCheckout = async () => {
    if (!window.Paddle) {
      toast({ title: "Error", description: "El sistema de pagos no está disponible.", variant: "destructive" });
      return;
    }

    if (!nextPlan || !nextPlan.paddlePriceId) {
      toast({ title: "Error", description: "Este plan no está disponible para pago online.", variant: "destructive" });
      return;
    }

    setLoadingCheckout(true);

    try {
      const response = await fetch('/api/paddle/generate-pay-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: nextPlan.paddlePriceId,
          userId: user?.id,
          userEmail: user?.email
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      if (data.transactionId) {
        window.Paddle.Checkout.open({ transactionId: data.transactionId });
      } else if (data.checkoutUrl) {
        window.Paddle.Checkout.open({ override: data.checkoutUrl });
      } else {
        throw new Error('No se pudo iniciar el checkout');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingCheckout(false);
    }
  };

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

          {user.suscripcion.status === 'active' && user.suscripcion.current_period_start && (
             <div>
              <p className="text-sm font-medium text-slate-500">Período actual desde:</p>
              <p className="text-lg">{new Date(user.suscripcion.current_period_start).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}

          {user.suscripcion.status === 'active' && user.suscripcion.current_period_end && (
             <div>
              <p className="text-sm font-medium text-slate-500">Próxima fecha de renovación:</p>
              <p className="text-lg">{new Date(user.suscripcion.current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}
          
           {user.suscripcion.created_at && (
            <div>
              <p className="text-sm font-medium text-slate-500">Suscripción (o prueba) iniciada el:</p>
              <p className="text-lg">{new Date(user.suscripcion.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
           )}

        </div>
      ) : (
        <p className="text-slate-500">No se pudo cargar la información de tu plan. Si el problema persiste, contacta a soporte.</p>
      )}
      <ToastProvider>
        <Toast open={open} onOpenChange={setOpen}>
          <ToastTitle>{nextPlan ? nextPlan.name : 'No hay plan superior'}</ToastTitle>
          <ToastDescription>
            {nextPlan ? nextPlan.description : 'Contacta a soporte para más información.'}
          </ToastDescription>
          <Button onClick={handleCheckout} disabled={loadingCheckout}>
            {loadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comprar Plan
          </Button>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </motion.div>