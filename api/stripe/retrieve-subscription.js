// api/stripe/retrieve-subscription.js
import Stripe from 'stripe';

// Inicializa Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } });
  }

  const { subscriptionId } = req.query;

  if (!subscriptionId) {
    return res.status(400).json({ error: { message: 'subscriptionId es requerido.' } });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    res.status(200).json({ subscription });
  } catch (error) {
    console.error(`Error al recuperar la suscripción ${subscriptionId}:`, error);
    res.status(500).json({ error: { message: error.message || 'Ocurrió un error al recuperar la suscripción.' } });
  }
};