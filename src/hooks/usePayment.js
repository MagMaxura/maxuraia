// Archivo: src/hooks/usePayment.js
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast'; // Asegúrate que la ruta sea correcta

export const usePayment = () => {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async (planDetails, user, dynamicUrls = {}) => {
    if (!planDetails || !planDetails.stripePriceId) {
      console.error('usePayment: planDetails.stripePriceId no está definido.');
      toast({ title: "Error de Configuración", description: 'Información del plan no disponible.', variant: "destructive" });
      return;
    }
    if (!user || !user.id || !user.email) {
      console.error('usePayment: Información del usuario incompleta.');
      toast({ title: "Error de Usuario", description: 'Se requiere información de usuario para el pago.', variant: "destructive" });
      return;
    }

    setLoadingCheckout(true);
    console.log('usePayment - Iniciando checkout para priceId:', planDetails.paddlePriceId, 'Usuario Email:', user.email);

    try {
      const payload = {
        priceId: planDetails.paddlePriceId,
        userId: user.id, // Se usará como recruiter_id en custom_data en el backend
        userEmail: user.email,
        successUrl: dynamicUrls.successUrl, // Opcional, el backend tiene un fallback
        cancelUrl: dynamicUrls.cancelUrl    // Opcional, el backend puede tener un fallback
      };

      // Eliminar URLs si no se proporcionaron para usar los defaults del backend
      if (!payload.successUrl) delete payload.successUrl;
      if (!payload.cancelUrl) delete payload.cancelUrl;
      
      const response = await fetch('/api/stripe/create-checkout-session', { // Usando endpoint de Stripe
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('usePayment - Error del API generate-pay-link:', data);
        toast({ 
          title: "Error al Iniciar Pago", 
          description: data.message || data.errorDetails || 'No se pudo generar el enlace de pago. Intenta de nuevo.', 
          variant: "destructive" 
        });
        setLoadingCheckout(false);
        return;
      }

      if (data.checkoutUrl) {
        console.log('usePayment - Checkout URL recibida, redirigiendo:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
        // setLoadingCheckout(false) no es necesario aquí debido a la redirección
      } else {
        console.error('usePayment - No se recibió checkoutUrl del API.');
        toast({ title: "Error Inesperado", description: 'No se pudo obtener el enlace de pago del servidor.', variant: "destructive" });
        setLoadingCheckout(false);
      }
    } catch (error) {
      console.error('usePayment - Excepción al llamar a generate-pay-link:', error);
      toast({ title: "Error de Red", description: 'Ocurrió un problema al generar el pago. Revisa tu conexión.', variant: "destructive" });
      setLoadingCheckout(false);
    }
  };

  return { loadingCheckout, handleCheckout };
};