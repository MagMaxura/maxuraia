// api/stripe/create-payment-intent.js
import Stripe from 'stripe';
import { APP_PLANS } from '../_lib/plans.js'; // Ruta corregida y consistente

// Verifica la clave secreta de Stripe al inicio.
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('FATAL_ERROR: STRIPE_SECRET_KEY no está configurada en las variables de entorno.');
  // En un entorno de producción real, podrías querer que la función falle de forma más ruidosa
  // o tener un mecanismo de alerta si esto sucede.
}

// Inicializa Stripe una vez. La instancia se reutilizará en las invocaciones de la función.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Usa la versión de API más reciente o la que prefieras
});

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } });
  }

  const { priceId, recruiterId, email } = req.body;

  // Validación de datos de entrada
  if (!priceId) {
    return res.status(400).json({ error: { message: 'priceId es requerido' } });
  }
  if (!recruiterId) {
    return res.status(400).json({ error: { message: 'recruiterId es requerido' } });
  }
  if (!email) {
    // Podrías también validar el formato del email si es necesario
    return res.status(400).json({ error: { message: 'email es requerido' } });
  }

  // Busca el plan en la configuración local
  const plan = Object.values(APP_PLANS).find(p => p.stripePriceId === priceId);

  if (!plan) {
    console.warn(`Intento de creación de PaymentIntent para priceId no encontrado: ${priceId}`);
    return res.status(404).json({ error: { message: 'Plan no encontrado para el priceId proporcionado' } });
  }

  // El monto debe estar en la unidad más pequeña de la moneda (ej. centavos)
  const amountInCents = plan.priceNumeric;

  if (typeof amountInCents !== 'number' || amountInCents <= 0) {
    console.error(`Monto inválido para el plan ${plan.id}: ${amountInCents}. Debe ser un número positivo.`);
    return res.status(400).json({ error: { message: 'Monto del plan inválido o no configurado.' } });
  }

  try {
    // --- INICIO DE LA MEJORA ---
    let customer;
    // 1. Busca si ya existe un cliente en Stripe con ese email
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length > 0) {
        // Si existe, úsalo
        customer = customers.data[0];
        console.log(`Cliente de Stripe encontrado: ${customer.id}`);
    } else {
        // Si no existe, créalo
        customer = await stripe.customers.create({
            email: email,
            metadata: { recruiterId: String(recruiterId) } // Es bueno guardar el ID aquí también
        });
        console.log(`Nuevo cliente de Stripe creado: ${customer.id}`);
    }
    // --- FIN DE LA MEJORA ---

    const paymentIntentParams = {
        customer: customer.id, // <-- AÑADES ESTA LÍNEA para asociar el pago al cliente
        amount: amountInCents,
        currency: 'ars', // Asegúrate de que esta moneda esté activa en tu cuenta de Stripe
        metadata: {
            recruiterId: String(recruiterId),
            email: String(email),
            planId: String(plan.id), // ID interno de tu plan
            stripePriceId: String(priceId), // Price ID de Stripe usado
        },
        automatic_payment_methods: { enabled: true },
    };

    console.log('Creando PaymentIntent con params:', paymentIntentParams);
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    console.log(`PaymentIntent ${paymentIntent.id} creado exitosamente para recruiter ${recruiterId}`);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error(`Error al crear Stripe Payment Intent para recruiter ${recruiterId} con priceId ${priceId}:`, error);
    // Devuelve un error genérico pero loguea el detalle
    res.status(500).json({ error: { message: error.message || 'Ocurrió un error al procesar el pago.' } });
  }
};