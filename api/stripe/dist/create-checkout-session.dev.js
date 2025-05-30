// Archivo: api/stripe/create-checkout-session.js
// Este archivo ha sido comentado temporalmente ya que se está utilizando la integración con Stripe Elements
// y para reducir el número de funciones Serverless para el límite del plan Hobby de Vercel.

/*
import Stripe from 'stripe';

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

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // O 'subscription' si estás vendiendo suscripciones
      // TODO: Configura estas URLs correctamente para tu aplicación
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment-cancelled`,
      metadata: {
        recruiterId: recruiterId,
        email: email,
      },
      // Opcional: precargar el email del cliente
      customer_email: email,
    });

    res.status(200).json({ checkoutUrl: session.url });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};
*/
"use strict";