import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button'; // Asumo que tienes este componente
import { Loader2 } from 'lucide-react'; // Para el indicador de carga

const StripePaymentForm = ({ clientSecret, onSuccess, onCancel }) => { // Recibe clientSecret como prop
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    // Valida y envía los datos del formulario
    const { error: submitError } = await elements.submit();
    if (submitError) {
        // Muestra errores de validación del formulario si los hay
        setMessage(submitError.message);
        setIsLoading(false);
        return;
    }

    // Confirma el pago utilizando el clientSecret recibido
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret, // Usa el clientSecret recibido
      confirmParams: {
        // Asegúrate de que esta URL sea la página a la que redirigir después del pago
        return_url: `${window.location.origin}/payment-success`, // Redirige a la página de éxito
      },
    });

    // Este punto solo se alcanzará si hay un error inmediato (ej. error de validación)
    // La redirección a return_url ocurre en caso de éxito o ciertos fallos que requieren autenticación 3D Secure
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("Ocurrió un error inesperado.");
      }
      // Si hay un error, puedes llamar a onCancel si lo necesitas
      // onCancel?.();
    } else {
        // Si no hay error inmediato, significa que la confirmación fue exitosa
        // o que se requiere una acción adicional (como 3D Secure),
        // y Stripe redirigirá automáticamente a la return_url.
        // No necesitas hacer nada aquí, la página de éxito manejará la confirmación final.
    }

    setIsLoading(false);
  };

  // Configura las opciones para el Payment Element si es necesario
  const paymentElementOptions = {
    layout: 'tabs', // O 'accordion', 'auto'
    // Puedes añadir más opciones de apariencia aquí
  };


  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      {/* Stripe Payment Element */}
      {/* Este elemento renderizará los campos de tarjeta, etc. */}
      {/* Pasa las opciones configuradas */}
      <PaymentElement id="payment-element" options={paymentElementOptions} />

      <Button disabled={isLoading || !stripe || !elements} className="mt-4 w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pagar ahora"}
      </Button>

      {/* Show any error or success messages */}
      {message && <div id="payment-message" className="mt-4 text-red-500">{message}</div>}
    </form>
  );
};

export default StripePaymentForm;