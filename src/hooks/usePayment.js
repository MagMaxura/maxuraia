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
      console.error('usePayment: Información del usuario incompleta (ID o email faltante).');
      toast({ title: "Error de Usuario", description: 'Se requiere información de usuario (ID y email) para el pago.', variant: "destructive" });
      setLoadingCheckout(false);
      return;
    }

    setLoadingCheckout(true);
    console.log('usePayment - Iniciando checkout para stripePriceId:', planDetails.stripePriceId, 'Usuario Email:', user.email);

    try {
      const payload = {
        priceId: planDetails.stripePriceId, // Usar el ID de precio de Stripe
        recruiterId: user.id, // Se usará como recruiter_id en custom_data en el backend
        email: user.email,
        successUrl: dynamicUrls.successUrl, // Opcional, el backend tiene un fallback
        cancelUrl: dynamicUrls.cancelUrl    // Opcional, el backend puede tener un fallback
      };

      // Eliminar URLs si no se proporcionaron para usar los defaults del backend
      if (!payload.successUrl) delete payload.successUrl;
      if (!payload.cancelUrl) delete payload.cancelUrl;
      
      let response;
      let data;

      if (planDetails.type === 'one-time') {
        // Para planes de pago único, usar Stripe Checkout Session
        response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        data = await response.json();

        if (!response.ok) {
          console.error('usePayment - Error del API create-checkout-session:', data);
          toast({
            title: "Error al Iniciar Pago",
            description: data.message || data.error || 'No se pudo iniciar el proceso de pago. Intenta de nuevo.',
            variant: "destructive"
          });
          setLoadingCheckout(false);
          return;
        }

        if (data.checkoutUrl) {
          console.log('usePayment - Redirigiendo a Stripe Checkout:', data.checkoutUrl);
          window.location.href = data.checkoutUrl; // Redirigir al usuario a la URL de checkout
        } else {
          console.error('usePayment - No se recibió checkoutUrl del API.');
          toast({ title: "Error Inesperado", description: 'No se pudo obtener la URL de pago del servidor.', variant: "destructive" });
        }

      } else {
        // Para planes de suscripción, seguir usando Payment Intent (o adaptar si se decide usar Checkout para suscripciones)
        response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        data = await response.json();

        if (!response.ok) {
          console.error('usePayment - Error del API create-payment-intent:', data);
          toast({
            title: "Error al Iniciar Pago",
            description: data.message || data.error || 'No se pudo iniciar el proceso de pago. Intenta de nuevo.',
            variant: "destructive"
          });
          setLoadingCheckout(false);
          return;
        }

        if (data.clientSecret) {
          console.log('usePayment - Payment Intent clientSecret recibido.');
          toast({ title: "Proceso de Pago Iniciado", description: "Continúa en el formulario de pago.", variant: "success" });
          // Aquí se esperaría la lógica para confirmar el pago con Stripe Elements
        } else {
          console.error('usePayment - No se recibió clientSecret del API.');
          toast({ title: "Error Inesperado", description: 'No se pudo obtener la información de pago del servidor.', variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('usePayment - Excepción al llamar a create-payment-intent:', error);
      toast({ title: "Error de Red", description: 'Ocurrió un problema al iniciar el pago. Revisa tu conexión.', variant: "destructive" });
    } finally {
      setLoadingCheckout(false); // Asegurarse de que loading se desactive
    }
  };

  return { loadingCheckout, handleCheckout };
};