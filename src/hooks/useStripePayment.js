import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Carga tu clave pública de Stripe. Asegúrate de tenerla en tus variables de entorno.
// Es seguro exponer la clave pública en el frontend.
// Usamos import.meta.env para acceder a las variables de entorno en Vite
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const useStripePayment = () => {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async (priceId, recruiterId, email, dynamicUrls = {}) => {
    setLoadingCheckout(true);
    setError(null);

    try {
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Failed to load Stripe.js');
      }

      // Llama a tu endpoint de backend para crear la sesión de checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          recruiterId,
          email,
          ...dynamicUrls, // Pasa URLs dinámicas si existen
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Stripe checkout session');
      }

      const { checkoutUrl } = await response.json();

      if (checkoutUrl) {
        // Redirige al usuario a la página de checkout de Stripe
        window.location.href = checkoutUrl;
        // O si prefieres usar redirectToCheckout (requiere session.id en lugar de session.url):
        // const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
        // if (error) {
        //   throw new Error(error.message);
        // }
      } else {
        throw new Error('Checkout URL not received from backend');
      }

    } catch (err) {
      console.error('Stripe checkout error:', err);
      setError(err.message);
      // Aquí podrías integrar una notificación toast para el usuario
    } finally {
      setLoadingCheckout(false);
    }
  };

  return {
    loadingCheckout,
    error,
    handleCheckout,
  };
};