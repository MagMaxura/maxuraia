// Archivo: hooks/usePayment.js

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast'; // Asumo que tienes este componente para notificaciones

export const usePayment = () => {
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Considera añadir successUrl y cancelUrl como parámetros si necesitas que sean dinámicos
  const handleCheckout = async (nextPlan, user, successUrlOverride, cancelUrlOverride) => {
    if (!nextPlan || !nextPlan.paddlePriceId) {
      console.error('usePayment: nextPlan o nextPlan.paddlePriceId no están definidos.');
      toast({ title: "Error de configuración", description: 'Información del plan no disponible.', variant: "destructive" });
      return;
    }
    if (!user || !user.id || !user.email) {
      console.error('usePayment: user, user.id, o user.email no están definidos.');
      // Podrías redirigir a login o mostrar un error más específico si el usuario no está autenticado
      toast({ title: "Error de usuario", description: 'Información de usuario incompleta.', variant: "destructive" });
      return;
    }

    setLoadingCheckout(true);
    console.log('usePayment - Iniciando checkout para el plan:', nextPlan.paddlePriceId, 'Usuario:', user.email);

    try {
      const payload = {
        priceId: nextPlan.paddlePriceId,
        userId: user.id,       // Tu backend espera 'userId' y lo usa como 'recruiter_id' en custom_data
        userEmail: user.email,
      };

      // Añadir URLs si se proporcionan y son diferentes de las predeterminadas en el backend
      if (successUrlOverride) {
        payload.successUrl = successUrlOverride;
      }
      if (cancelUrlOverride) {
        payload.cancelUrl = cancelUrlOverride;
      }

      const response = await fetch('/api/paddle/generate-pay-link', { // Asegúrate que esta ruta sea correcta
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('usePayment - Error en la respuesta del API generate-pay-link:', data);
        toast({ 
          title: "Error al Iniciar Pago", 
          description: data.message || data.errorDetails || 'No se pudo generar el enlace de pago. Intenta de nuevo.', 
          variant: "destructive" 
        });
        setLoadingCheckout(false); // Asegúrate de resetear el loading aquí también
        return;
      }

      if (data.checkoutUrl) {
        console.log('usePayment - Checkout URL recibida, redirigiendo:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
        // No necesitas setLoadingCheckout(false) aquí porque la página va a cambiar.
      } else {
        console.error('usePayment - No se recibió checkoutUrl del API.');
        toast({ title: "Error Inesperado", description: 'No se pudo obtener el enlace de pago del servidor.', variant: "destructive" });
        setLoadingCheckout(false); // Resetear loading si no hay URL
      }
    } catch (error) {
      console.error('usePayment - Excepción al llamar a generate-pay-link:', error);
      toast({ title: "Error de Red", description: 'Ocurrió un problema al intentar generar el pago. Revisa tu conexión.', variant: "destructive" });
      setLoadingCheckout(false); // Resetear loading en caso de excepción
    } 
    // El 'finally' que tenías es bueno, pero si hay redirección, 
    // el setLoadingCheckout(false) podría no ejecutarse o ser innecesario.
    // Lo he movido dentro de los flujos de error donde no hay redirección.
  };

  return { loadingCheckout, handleCheckout };
};