// StripePaymentForm.jsx
import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

const StripePaymentForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null); // Para mensajes de error o informativos
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('StripePaymentForm: handleSubmit called'); // Add this log

    if (!stripe || !elements) {
      // Stripe.js o Elements no se han cargado aún.
      // Esto no debería ocurrir si el botón de submit está deshabilitado correctamente.
      console.warn('Stripe.js o Elements no están listos.');
      setMessage('El formulario de pago no está listo. Intente de nuevo en un momento.');
      return;
    }

    setIsLoading(true);
    setMessage(null); // Limpia mensajes previos

    try {
      const { error } = await stripe.confirmPayment({
        elements, // El PaymentElement obtiene el clientSecret del provider Elements que lo envuelve
        confirmParams: {
          // Esta es la URL a la que Stripe redirigirá al usuario después del pago.
          // Debe ser una página en tu aplicación que pueda manejar la confirmación final
          // del estado del PaymentIntent usando el client_secret del PaymentIntent en la URL.
          return_url: `${window.location.origin}/payment-success`, // URL de retorno corregida
        },
      });

      // Si `confirmPayment` devuelve un error aquí, es un error inmediato
      // (ej. validación de tarjeta, error de red antes de la redirección).
      // Para muchos flujos (ej. 3D Secure), Stripe redirigirá antes de llegar aquí.
      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "Por favor, revisa los datos de tu tarjeta.");
        } else {
          console.error("Error inesperado en confirmPayment:", error);
          setMessage("Ocurrió un error inesperado al procesar tu pago.");
        }
        // Opcional: llamar a onCancel si el error es definitivo y no una simple validación
        // onCancel?.();
      } else {
        // Si no hay error inmediato, Stripe está manejando la redirección a la `return_url`.
        // No se espera llegar aquí si la redirección ocurre.
        // Sin embargo, si no hay redirección y no hay error, podría ser un estado inesperado.
        setMessage("Procesando pago... Serás redirigido en breve.");
      }
    } catch (unexpectedError) {
        // Captura cualquier error no previsto durante la llamada a confirmPayment
        console.error("Error catastrófico en handleSubmit:", unexpectedError);
        setMessage("Ocurrió un error crítico. Por favor, intenta más tarde.");
    }


    setIsLoading(false);
  };

  // Opciones de configuración para el PaymentElement
  const paymentElementOptions = {
    layout: 'tabs', // 'tabs', 'accordion', o 'auto'
    // También puedes personalizar la apariencia aquí:
    // appearance: { theme: 'stripe', /* ... */ },
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={paymentElementOptions} />

      <Button
        type="submit" // Asegura que sea de tipo submit para el form
        onClick={handleSubmit} // Add onClick handler
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          "Pagar ahora"
        )}
      </Button>

      {message && (
        <div
          id="payment-message"
          className={`mt-4 p-3 rounded-md text-sm flex items-center ${
            message.toLowerCase().includes('error') || message.toLowerCase().includes('fallo') || message.toLowerCase().includes('inválido')
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700' // Para mensajes informativos
          }`}
        >
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {message}
        </div>
      )}
    </form>
  );
};

export default StripePaymentForm;