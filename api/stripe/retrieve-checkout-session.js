// api/stripe/retrieve-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId es requerido' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'], // Opcional: expandir el PaymentIntent para obtener más detalles
    });

    res.status(200).json({ session });
  } catch (error) {
    console.error('Error retrieving Stripe checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};