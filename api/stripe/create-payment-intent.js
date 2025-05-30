import Stripe from 'stripe';
import { APP_PLANS } from '../../api/_lib/plans'; // Importa tus planes para obtener el precio (ruta ajustada para Vercel)

// Asegúrate de tener tu clave secreta de Stripe en las variables de entorno
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY no está configurada en las variables de entorno.');
    // Podrías lanzar un error aquí o manejarlo de otra manera si prefieres
}
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

  // Busca el plan en tu configuración local para obtener el precio numérico
  // NOTA: En un entorno de producción real, deberías obtener el precio
  // directamente desde Stripe usando el priceId para evitar manipulaciones
  // en el frontend. Sin embargo, para este ejemplo, lo obtenemos de APP_PLANS.
  const plan = Object.values(APP_PLANS).find(p => p.stripePriceId === priceId);

  if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado para el priceId proporcionado' });
  }

  // El monto debe estar en la unidad más pequeña de la moneda (ej. centavos para ARS)
  // Asegúrate de que priceNumeric en APP_PLANS sea el monto correcto en centavos
  const amountInCents = plan.priceNumeric; // Asumiendo que priceNumeric ya está en centavos

  try {
    // Verifica si la clave de Stripe se inicializó correctamente (aunque el constructor puede lanzar un error antes)
    if (!stripe) {
        throw new Error('Stripe no se inicializó correctamente. Verifica STRIPE_SECRET_KEY.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'ars', // Asegúrate de que la moneda sea correcta
      metadata: {
        recruiterId: recruiterId,
        email: email,
        planId: plan.id, // Guarda el ID de tu plan interno también
      },
      // Opcional: agregar customer si ya tienes uno en Stripe
      // customer: 'cus_...',
      // Opcional: agregar setup_future_usage si es una suscripción
      // setup_future_usage: 'off_session',
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error creating Stripe Payment Intent:', error);
    res.status(500).json({ error: error.message });
  }
};