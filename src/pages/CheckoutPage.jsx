import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Asumo que tienes este hook
import { Elements } from '@stripe/react-stripe-js'; // Importa Elements
import { loadStripe } from '@stripe/stripe-js'; // Importa loadStripe
import StripePaymentForm from '@/components/StripePaymentForm'; // Tu componente de formulario
import { APP_PLANS } from '@/config/plans'; // Para obtener detalles del plan
import { Loader2 } from 'lucide-react'; // Para el indicador de carga

const CheckoutPage = () => {
  const { priceId } = useParams(); // Obtiene priceId de la URL (ej: /checkout/:priceId)
  const { user, loading: loadingUser } = useAuth();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [error, setError] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);

  useEffect(() => {
    if (loadingUser || !user) {
        // Espera a que el usuario cargue o redirige si no está autenticado
        // (ProtectedRoute debería manejar esto, pero es buena práctica verificar)
        if (!loadingUser && !user) {
             navigate('/login'); // Redirige si no hay usuario autenticado
        }
        return;
    }

    if (!priceId) {
      setError('No se proporcionó un Price ID de Stripe.');
      setLoadingIntent(false);
      return;
    }

    const plan = Object.values(APP_PLANS).find(p => p.stripePriceId === priceId);
    if (!plan) {
        setError('Plan no encontrado para el Price ID proporcionado.');
        setLoadingIntent(false);
        return;
    }
    setPlanDetails(plan);


    // Crea el PaymentIntent en el backend
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: priceId,
            recruiterId: user.id, // Pasa el ID del usuario
            email: user.email, // Pasa el email del usuario
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear Payment Intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);

      } catch (err) {
        console.error('Error fetching Payment Intent:', err);
        setError(err.message);
      } finally {
        setLoadingIntent(false);
      }
    };

    createPaymentIntent();

  }, [priceId, user, loadingUser, navigate]); // Dependencias del efecto

  if (loadingUser || loadingIntent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Cargando pago...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

// Carga tu clave pública de Stripe. Asegúrate de tenerla en tus variables de entorno.
// Es seguro exponer la clave pública en el frontend.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      {planDetails && (
          <div className="mb-4">
              <h2 className="text-xl font-semibold">{planDetails.name}</h2>
              <p>Precio: {planDetails.priceDisplay}</p>
          </div>
      )}
      {clientSecret && (
        // Envuelve el formulario con Elements y pasa el clientSecret
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm clientSecret={clientSecret} onSuccess={() => navigate('/payment-success')} onCancel={() => navigate('/payment-cancelled')} />
        </Elements>
      )}
    </div>
  );
};

export default CheckoutPage;