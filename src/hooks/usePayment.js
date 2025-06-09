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
      setLoadingCheckout(false); // Asegurarse de desactivar el loading si la validación falla
      return;
    }

    setLoadingCheckout(true);
    console.log('usePayment - Iniciando checkout para priceId:', planDetails.paddlePriceId, 'Usuario Email:', user.email);

    try {
      const payload = {
        priceId: planDetails.stripePriceId, // Usar el ID de precio de Stripe
        userId: user.id, // Se usará como recruiter_id en custom_data en el backend
        userEmail: user.email,
        successUrl: dynamicUrls.successUrl, // Opcional, el backend tiene un fallback
        cancelUrl: dynamicUrls.cancelUrl    // Opcional, el backend puede tener un fallback
      };

      // Eliminar URLs si no se proporcionaron para usar los defaults del backend
      if (!payload.successUrl) delete payload.successUrl;
      if (!payload.cancelUrl) delete payload.cancelUrl;
      
      const response = await fetch('/api/stripe/create-payment-intent', { // Usando endpoint de Stripe Payment Intent
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

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

      // Si la respuesta es exitosa, esperamos un clientSecret
      if (data.clientSecret) {
        console.log('usePayment - Payment Intent clientSecret recibido.');
        // Aquí deberías integrar la lógica de Stripe Elements para confirmar el pago
        // Esto probablemente implica usar stripe.js y los Elements montados en tu UI.
        // Por ahora, solo logueamos el éxito y el clientSecret.
        // La confirmación del pago con Elements ocurriría DESPUÉS de recibir este clientSecret.

        // Ejemplo conceptual (requiere la instancia de Stripe Elements):
        // const stripe = useStripe(); // Asumiendo que tienes un hook para obtener la instancia de Stripe
        // const elements = useElements(); // Asumiendo que tienes un hook para obtener la instancia de Elements
        // const cardElement = elements.getElement(CardElement); // O el Element que estés usando

        // const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(data.clientSecret, {
        //   payment_method: {
        //     card: cardElement,
        //     billing_details: {
        //       email: user.email,
        //     },
        //   },
        // });

        // if (confirmError) {
        //   console.error('usePayment - Error confirming payment:', confirmError);
        //   toast({ title: "Error en el Pago", description: confirmError.message, variant: "destructive" });
        // } else if (paymentIntent.status === 'succeeded') {
        //   console.log('usePayment - Pago exitoso:', paymentIntent);
        //   toast({ title: "Pago Exitoso", description: "Tu pago ha sido procesado.", variant: "success" });
        //   // Redirigir o actualizar UI tras pago exitoso
        //   // window.location.href = dynamicUrls.successUrl || '/payment-success';
        // }

        // Como no tengo acceso directo a la implementación de Stripe Elements aquí,
        // simplemente indicaré que el clientSecret fue recibido y la siguiente etapa
        // (confirmación del pago con Elements) debería ocurrir ahora.
        toast({ title: "Proceso de Pago Iniciado", description: "Continúa en el formulario de pago.", variant: "success" });

      } else {
        console.error('usePayment - No se recibió clientSecret del API.');
        toast({ title: "Error Inesperado", description: 'No se pudo obtener la información de pago del servidor.', variant: "destructive" });
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