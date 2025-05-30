import Stripe from 'stripe';
import { buffer } from 'micro'; // Necesario para leer el cuerpo crudo de la solicitud
import { createClient } from '@supabase/supabase-js'; // Importa Supabase
import { APP_PLANS } from '../_lib/plans'; // Importa tus planes para mapear Product IDs (ruta ajustada para Vercel)

// Asegúrate de tener tus claves de Stripe y Supabase en las variables de entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Usa la versión de API más reciente o la que prefieras
});

// Inicializa el cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Usa la Service Key para acceso con privilegios en el backend
);

// Función para mapear Stripe Product ID a tu plan interno ID
const getPlanIdByStripeProductId = (stripeProductId) => {
    const plan = Object.values(APP_PLANS).find(p => p.stripeProductId === stripeProductId);
    return plan ? plan.id : null;
};

// Función para mapear Stripe Price ID a tu plan interno ID (útil si la metadata del PI solo tiene Price ID)
const getPlanIdByStripePriceId = (stripePriceId) => {
    const plan = Object.values(APP_PLANS).find(p => p.stripePriceId === stripePriceId);
    return plan ? plan.id : null;
};


// Esto es necesario para que Vercel no parsee el body del webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Clave secreta del webhook

  let event;

  try {
    // Lee el cuerpo crudo de la solicitud
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Maneja los tipos de eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent succeeded:', paymentIntent.id);

      // Accede a la metadata que pasamos al crear el PaymentIntent
      const { recruiterId, planId: planIdFromMetadata } = paymentIntent.metadata; // planId aquí es tu ID interno

      // Si el PaymentIntent está asociado a una suscripción, la lógica principal se maneja en customer.subscription.*
      // Si no está asociado a una suscripción, podría ser un pago único.
      if (paymentIntent.invoice || paymentIntent.subscription) {
          console.log(`ℹ️ PaymentIntent ${paymentIntent.id} is associated with a subscription/invoice. Handled by other events.`);
          // La lógica para actualizar la suscripción se manejará en invoice.paid o customer.subscription.updated
      } else if (recruiterId && planIdFromMetadata) {
          // Este podría ser un pago único (como Búsqueda Puntual)
          const isOneTimePayment = APP_PLANS[planIdFromMetadata]?.type === 'one-time';

          if (isOneTimePayment) {
               try {
                   // Para pago único, calcula la fecha de fin (1 mes después)
                   const endDate = new Date();
                   endDate.setMonth(endDate.getMonth() + 1);

                   // Upsert para actualizar o insertar la suscripción de pago único
                   const { data, error } = await supabase
                       .from('suscripciones')
                       .upsert({
                           recruiter_id: recruiterId,
                           plan_id: planIdFromMetadata,
                           status: 'active', // O un estado específico para pago único, ej. 'one_time_active'
                           trial_ends_at: null, // No aplica trial
                           current_period_start: new Date().toISOString(), // Inicio ahora
                           current_period_end: endDate.toISOString(), // Fin en 1 mes
                           stripe_subscription_id: null, // No hay suscripción de Stripe asociada
                           // Puedes añadir stripe_payment_intent_id: paymentIntent.id si quieres rastrear el PI
                           cvs_analizados_este_periodo: 0, // Reiniciar contador si aplica
                       }, { onConflict: 'recruiter_id' });

                   if (error) {
                       console.error('❌ Supabase upsert error for one-time payment:', error);
                   } else {
                       console.log(`🎉 One-time plan ${planIdFromMetadata} activated for user ${recruiterId} until ${endDate.toISOString()}.`);
                   }

              } catch (dbError) {
                console.error('❌ Database operation failed:', dbError);
              }
          } else {
              console.warn(`⚠️ PaymentIntent succeeded for plan ${planIdFromMetadata} (not one-time) without subscription/invoice association. Check flow.`);
          }
      } else {
        console.warn('⚠️ PaymentIntent metadata missing recruiterId or planId:', paymentIntent.metadata);
      }
      break;

    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object;
      console.log('✅ Subscription created:', subscriptionCreated.id);
      // Cuando se crea una suscripción (incluido el primer pago exitoso)
      const recruiterIdCreated = subscriptionCreated.metadata?.recruiterId || subscriptionCreated.customer; // Obtén recruiterId
      const stripeProductIdCreated = subscriptionCreated.items.data[0]?.price?.product; // Obtén el Product ID
      const planIdCreated = getPlanIdByStripeProductId(stripeProductIdCreated); // Mapea a tu ID interno

      if (recruiterIdCreated && planIdCreated) {
          try {
              // Crea o actualiza la suscripción en tu base de datos
              const { data, error } = await supabase
                  .from('suscripciones')
                  .upsert({ // Usar upsert para insertar o actualizar si ya existe por recruiter_id
                      recruiter_id: recruiterIdCreated,
                      plan_id: planIdCreated,
                      status: subscriptionCreated.status, // 'trialing', 'active', etc.
                      stripe_subscription_id: subscriptionCreated.id, // Guarda el ID de suscripción de Stripe
                      current_period_start: new Date(subscriptionCreated.current_period_start * 1000).toISOString(),
                      current_period_end: new Date(subscriptionCreated.current_period_end * 1000).toISOString(),
                      trial_ends_at: subscriptionCreated.trial_end ? new Date(subscriptionCreated.trial_end * 1000).toISOString() : null,
                      // Reinicia el contador de CVs analizados para el nuevo período si aplica
                      cvs_analizados_este_periodo: 0,
                  }, { onConflict: 'recruiter_id' }); // Conflict on recruiter_id

              if (error) {
                  console.error('❌ Supabase upsert error for subscription.created:', error);
              } else {
                  console.log(`🎉 Subscription ${subscriptionCreated.id} created/updated for user ${recruiterIdCreated} with plan ${planIdCreated}.`);
              }
          } catch (dbError) {
              console.error('❌ Database operation failed for subscription.created:', dbError);
          }
      } else {
          console.warn('⚠️ Subscription created event missing recruiterId or Product ID:', subscriptionCreated);
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object;
      console.log('✅ Subscription updated:', subscriptionUpdated.id);
      // Cuando se actualiza una suscripción (cambio de plan, estado, etc.)
      const recruiterIdUpdated = subscriptionUpdated.metadata?.recruiterId || subscriptionUpdated.customer;
      const stripeProductIdUpdated = subscriptionUpdated.items.data[0]?.price?.product;
      const planIdUpdated = getPlanIdByStripeProductId(stripeProductIdUpdated);

      if (recruiterIdUpdated && planIdUpdated) {
          try {
              const { data, error } = await supabase
                  .from('suscripciones')
                  .update({
                      plan_id: planIdUpdated, // Obtiene el nuevo Product ID
                      status: subscriptionUpdated.status, // Nuevo estado
                      current_period_start: new Date(subscriptionUpdated.current_period_start * 1000).toISOString(),
                      current_period_end: new Date(subscriptionUpdated.current_period_end * 1000).toISOString(),
                      trial_ends_at: subscriptionUpdated.trial_end ? new Date(subscriptionUpdated.trial_end * 1000).toISOString() : null,
                      // Reinicia el contador de CVs si el período ha cambiado (lógica más compleja podría ser necesaria aquí)
                      // cvs_analizados_este_periodo: 0, // Podría ser necesario resetear en ciertos cambios
                  })
                  .eq('recruiter_id', recruiterIdUpdated); // O podrías usar stripe_subscription_id si lo guardaste

              if (error) {
                  console.error('❌ Supabase update error for subscription.updated:', error);
              } else {
                  console.log(`🎉 Subscription ${subscriptionUpdated.id} updated for user ${recruiterIdUpdated} to plan ${planIdUpdated}.`);
              }
          } catch (dbError) {
              console.error('❌ Database operation failed for subscription.updated:', dbError);
          }
      } else {
          console.warn('⚠️ Subscription updated event missing recruiterId or Product ID:', subscriptionUpdated);
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object;
      console.log('✅ Subscription deleted:', subscriptionDeleted.id);
      // Cuando una suscripción se cancela o finaliza
      const recruiterIdDeleted = subscriptionDeleted.metadata?.recruiterId || subscriptionDeleted.customer;

      if (recruiterIdDeleted) {
          try {
              const { data, error } = await supabase
                  .from('suscripciones')
                  .update({
                      status: subscriptionDeleted.status, // Debería ser 'canceled' o similar
                      // Opcional: podrías establecer plan_id a un estado 'free' o null
                      // plan_id: 'free',
                      // end_date: new Date(subscriptionDeleted.ended_at * 1000).toISOString(), // Si tienes una columna end_date
                  })
                  .eq('recruiter_id', recruiterIdDeleted); // O usar stripe_subscription_id

              if (error) {
                  console.error('❌ Supabase update error for subscription.deleted:', error);
              } else {
                  console.log(`🎉 Subscription ${subscriptionDeleted.id} deleted for user ${recruiterIdDeleted}.`);
              }
          } catch (dbError) {
              console.error('❌ Database operation failed for subscription.deleted:', dbError);
            }
        } else {
            console.warn('⚠️ Subscription deleted event missing recruiterId:', subscriptionDeleted);
        }
        break;

    case 'invoice.paid':
        const invoice = event.data.object;
        console.log('✅ Invoice paid:', invoice.id);
        // Este evento confirma el pago de una factura de suscripción recurrente.
        // Asegúrate de que el acceso del usuario se mantenga activo y actualiza las fechas del período.
        // La metadata puede estar en la factura o en la suscripción asociada a la factura
        const subscriptionIdFromInvoice = invoice.subscription; // ID de suscripción de Stripe
        const recruiterIdFromInvoice = invoice.metadata?.recruiterId || invoice.customer; // O del customer asociado

        if (recruiterIdFromInvoice && subscriptionIdFromInvoice) {
             try {
                 // Opcional: Obtener la suscripción completa si necesitas más detalles
                 // const subscription = await stripe.subscriptions.retrieve(subscriptionIdFromInvoice);

                 const { data, error } = await supabase
                     .from('suscripciones')
                     .update({
                         status: 'active', // Asegura que el estado sea activo
                         // Actualiza las fechas del período actual si es necesario
                         // current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                         // current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                     })
                     .eq('recruiter_id', recruiterIdFromInvoice); // O usar stripe_subscription_id

                 if (error) {
                     console.error('❌ Supabase update error for invoice.paid:', error);
                 } else {
                     console.log(`🎉 Subscription for user ${recruiterIdFromInvoice} confirmed active via invoice ${invoice.id}.`);
                 }
             } catch (dbError) {
                 console.error('❌ Database operation failed for invoice.paid:', dbError);
             }
        } else {
            console.warn('⚠️ Invoice paid event missing recruiterId or subscriptionId:', invoice);
        }
        break;

    case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object;
        console.log('❌ PaymentIntent failed:', paymentIntentFailed.id);
        // Notifica al usuario o inicia un flujo de recuperación de pagos
        // Puedes obtener recruiterId de paymentIntentFailed.metadata
        const recruiterIdFailed = paymentIntentFailed.metadata?.recruiterId;
        if (recruiterIdFailed) {
            try {
                // Opcional: Marcar la suscripción como inactiva o en estado de gracia
                const { data, error } = await supabase
                    .from('suscripciones')
                    .update({ status: 'past_due' }) // O 'unpaid', 'canceled' dependiendo de tu flujo
                    .eq('recruiter_id', recruiterIdFailed);

                if (error) {
                    console.error('❌ Supabase update error for payment_intent.payment_failed:', error);
                } else {
                    console.log(`⚠️ Subscription for user ${recruiterIdFailed} marked as past_due.`);
                }
            } catch (dbError) {
                console.error('❌ Database operation failed for payment_intent.payment_failed:', dbError);
            }
        }
        break;

    // ... maneja otros tipos de eventos relevantes para tu aplicación
    default:
      // console.log(`Unhandled event type ${event.type}`); // Puedes comentar esto si hay muchos eventos no manejados
  }

  // Retorna un 200 para acusar recibo del evento
  res.status(200).json({ received: true });
};