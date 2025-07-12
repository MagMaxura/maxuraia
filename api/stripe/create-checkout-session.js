// Archivo: api/stripe/create-checkout-session.js
// Este archivo ha sido comentado temporalmente ya que se está utilizando la integración con Stripe Elements
// y para reducir el número de funciones Serverless para el límite del plan Hobby de Vercel.
import Stripe from 'stripe';
import { APP_PLANS } from '../_lib/plans.js'; // Importar APP_PLANS

// Asegúrate de tener tu clave secreta de Stripe en las variables de entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Usa la versión de API más reciente o la que prefieras
});

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { priceId, recruiterId, email } = req.body;

  if (!priceId) {
    return res.status(400).json({ error: 'priceId es requerido' });
  }

  // Busca el plan en la configuración local
  const plan = Object.values(APP_PLANS).find(p => p.stripePriceId === priceId);

  if (!plan) {
    console.warn(`Intento de creación de Checkout Session para priceId no encontrado: ${priceId}`);
    return res.status(404).json({ error: { message: 'Plan no encontrado para el priceId proporcionado' } });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: plan.type === 'one-time' ? 'payment' : 'subscription', // Determina el modo basado en el tipo de plan
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment-cancelled`,
      metadata: {
        recruiterId: String(recruiterId),
        email: String(email),
        planId: String(plan.id), // ID interno de tu plan
        stripePriceId: String(priceId), // Price ID de Stripe usado
      },
      customer_email: email,
      // Propagar metadatos a la suscripción si es un plan de suscripción
      ...(plan.type !== 'one-time' && {
        subscription_data: {
          metadata: {
            recruiterId: String(recruiterId),
            planId: String(plan.id),
          },
        },
      }),
    });

    res.status(200).json({ checkoutUrl: session.url });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};