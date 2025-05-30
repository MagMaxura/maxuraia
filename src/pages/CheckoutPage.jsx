// CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '@/components/StripePaymentForm'; // Tu componente de formulario
import { APP_PLANS } from '@/config/plans'; // Asegúrate que la ruta a plans.js sea correcta desde aquí
import { Loader2 } from 'lucide-react';

// Carga tu clave pública de Stripe.
// Es seguro exponer la clave pública en el frontend.
// Asegúrate de que VITE_STRIPE_PUBLISHABLE_KEY esté definida en tu .env y en Vercel.
const VITE_STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!VITE_STRIPE_PUBLISHABLE_KEY) {
  console.error("FATAL_ERROR: VITE_STRIPE_PUBLISHABLE_KEY no está configurada.");
  // Podrías mostrar un error global o impedir la carga de la página de checkout.
}
const stripePromise = VITE_STRIPE_PUBLISHABLE_KEY ? loadStripe(VITE_STRIPE_PUBLISHABLE_KEY) : null;

const CheckoutPage = () => {
  const { priceId } = useParams();
  const { user, loading: loadingUser } = useAuth();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [error, setError] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);

  useEffect(() => {
    // Si la clave pública de Stripe no está disponible, no se puede continuar.
    if (!VITE_STRIPE_PUBLISHABLE_KEY) {
        setError('La configuración de pagos no está disponible. Por favor, contacta a soporte.');
        setLoadingIntent(false);
        return;
    }

    if (loadingUser) {
      // Espera a que la información del usuario termine de cargar
      return;
    }

    if (!user) {
      // Si después de cargar, no hay usuario, redirige al login
      console.log('CheckoutPage: Usuario no autenticado, redirigiendo a login.');
      navigate('/login', { replace: true, state: { from: `/checkout/${priceId}` } });
      return;
    }

    if (!priceId) {
      setError('No se proporcionó un ID de plan para el checkout.');
      setLoadingIntent(false);
      return;
    }

    const plan = Object.values(APP_PLANS).find(p => p.stripePriceId === priceId);
    if (!plan) {
      setError('El plan seleccionado no es válido o no fue encontrado.');
      setLoadingIntent(false);
      return;
    }
    setPlanDetails(plan);

    // Función para crear el PaymentIntent
    const createPaymentIntent = async () => {
      setLoadingIntent(true); // Asegura que el estado de carga se active al iniciar la creación
      setError(null); // Limpia errores previos
      try {
        console.log('CheckoutPage: Creando PaymentIntent para:', { priceId, userId: user.id, userEmail: user.email });
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: priceId,
            recruiterId: user.id,
            email: user.email,
          }),
        });

        const responseData = await response.json(); // Intenta parsear JSON siempre

        if (!response.ok) {
          // Si la respuesta no es OK, usa el mensaje de error del backend si existe
          throw new Error(responseData.error?.message || `Error del servidor: ${response.status}`);
        }

        if (responseData.clientSecret && typeof responseData.clientSecret === 'string') {
          console.log('CheckoutPage: Client Secret recibido:', responseData.clientSecret.substring(0, 15) + "..."); // Loguea solo una parte por seguridad
          setClientSecret(responseData.clientSecret);
        } else {
          throw new Error('Respuesta inválida del servidor: clientSecret no recibido o en formato incorrecto.');
        }

      } catch (err) {
        console.error('CheckoutPage: Error al crear Payment Intent:', err);
        setError(err.message || 'No se pudo iniciar el proceso de pago. Intenta de nuevo.');
      } finally {
        setLoadingIntent(false);
      }
    };

    // Solo crear Payment Intent si tenemos user y priceId, y aún no tenemos un clientSecret
    // ni estamos ya cargando uno, y no hay un error previo.
    if (user && priceId && !clientSecret && !loadingIntent && !error) {
         createPaymentIntent();
    }

  // No incluyas navigate en las dependencias si su identidad es estable (React Router v6)
  // o si solo lo usas dentro de condicionales que ya dependen de user/loadingUser.
  }, [priceId, user, loadingUser, clientSecret, loadingIntent, error]); // Añadir clientSecret, loadingIntent, error a dependencias


  if (loadingUser || loadingIntent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-purple-600" />
        <span className="text-lg">Cargando información de pago...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-red-600 p-4">
        <h2 className="text-xl font-semibold mb-2">Error al Cargar el Checkout</h2>
        <p className="text-center">{error}</p>
        <button
            onClick={() => navigate('/')} // O a la página de precios
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
            Volver al inicio
        </button>
      </div>
    );
  }

  // Solo renderiza Elements si stripePromise y clientSecret son válidos
  if (!stripePromise || !clientSecret) {
    // Este estado no debería alcanzarse si la lógica anterior de error/carga funciona bien,
    // pero es una salvaguarda adicional.
    return (
        <div className="flex flex-col justify-center items-center min-h-screen text-orange-500 p-4">
            <h2 className="text-xl font-semibold mb-2">Problema de Configuración</h2>
            <p className="text-center">No se pudo inicializar el formulario de pago. Por favor, verifica la configuración o contacta a soporte.</p>
        </div>
    );
  }

  // Opciones para el provider Elements
  const elementsOptions = {
    clientSecret: clientSecret,
    appearance: {
      theme: 'stripe', // o 'night', 'flat', o una apariencia personalizada
      // ... otras variables de apariencia
    },
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold text-center mb-8">Finalizar Compra</h1>
      {planDetails && (
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-slate-50">
          <h2 className="text-xl font-semibold text-gray-800">{planDetails.name}</h2>
          <p className="text-lg text-purple-700 font-medium">{planDetails.priceDisplay}</p>
          <p className="text-sm text-gray-600 mt-1">{planDetails.description}</p>
        </div>
      )}
      <Elements stripe={stripePromise} options={elementsOptions}>
        <StripePaymentForm
          // clientSecret ya no es necesario pasarlo aquí si se usa PaymentElement
          // ya que PaymentElement lo toma del provider Elements.
          // Si tuvieras una lógica compleja o necesitaras pasarlo por alguna razón,
          // puedes mantenerlo, pero usualmente no es requerido.
          // clientSecret={clientSecret}
          onSuccess={() => {
            console.log('CheckoutPage: Pago exitoso (manejado por return_url).');
            navigate('/payment-success'); // O donde sea que manejes el éxito
          }}
          onCancel={() => {
            console.log('CheckoutPage: Pago cancelado por el usuario.');
            navigate('/payment-cancelled'); // O a la página de precios
          }}
        />
      </Elements>
    </div>
  );
};

export default CheckoutPage;