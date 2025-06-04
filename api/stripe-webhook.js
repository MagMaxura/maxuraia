import Stripe from 'stripe';
import { buffer } from 'micro'; // Necesario para leer el cuerpo crudo de la solicitud
import { createClient } from '@supabase/supabase-js'; // Importa Supabase
import { APP_PLANS } from './_lib/plans.js'; // Ruta corregida después de mover el archivo

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
  console.log('Webhook received!'); // Añadir este log al inicio
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
    case 'payment_intent.succeeded': { // Usar bloque para scope
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
          const isOneTimePayment = APP_PLANS[planIdFromMetadata] && APP_PLANS[planIdFromMetadata].type === 'one-time';

          if (isOneTimePayment) {
               try {
                   // Obtener detalles del plan one-time comprado
                   const oneTimePlanDetails = APP_PLANS[planIdFromMetadata];
                   const additionalCvLimit = oneTimePlanDetails?.cvLimit || 0;
                   const additionalJobLimit = oneTimePlanDetails?.jobLimit || 0;

                   // Consultar el registro de suscripción existente
                   const { data: existingSubscription, error: fetchError } = await supabase
                       .from('suscripciones')
                       .select('CV_Max_plan, Jobs_Max_plan') // Seleccionar las columnas de límites actuales
                       .eq('recruiter_id', recruiterId)
                       .single();

                   if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 es "No rows found"
                       console.error('❌ Supabase fetch error checking for existing subscription:', fetchError);
                       throw new Error('Database error checking subscription.');
                   }

                   if (existingSubscription) {
                       console.log(`ℹ️ Existing subscription found for user ${recruiterId}. Adding one-time plan limits.`);
                       // Si ya existe una suscripción, sumar los límites adicionales
                       const { data, error } = await supabase
                           .from('suscripciones')
                           .update({
                                // Mantener el plan_id existente
                                status: 'active', // Asegurar que el estado sea activo si el pago fue exitoso
                                CV_Max_plan: (existingSubscription.CV_Max_plan || 0) + additionalCvLimit,
                               Jobs_Max_plan: (existingSubscription.Jobs_Max_plan || 0) + additionalJobLimit,
                               // Opcional: añadir una fecha de expiración para estos adicionales si se implementa
                               // adicionales_expire_at: new Date(Date.now() + ...).toISOString(),
                           })
                           .eq('recruiter_id', recruiterId);

                       if (error) {
                           console.error('❌ Supabase update error adding one-time limits:', error);
                           throw new Error('Database error updating subscription with additional limits.');
                       }
                       console.log(`🎉 Added ${additionalCvLimit} CVs and ${additionalJobLimit} jobs to existing subscription for user ${recruiterId}.`);

                   } else {
                       console.log(`ℹ️ No existing subscription found for user ${recruiterId}. Creating new one-time subscription.`);
                       // Si no existe una suscripción, crear una nueva con los detalles del plan one-time
                       const endDate = new Date();
                       endDate.setMonth(endDate.getMonth() + 1); // Ejemplo: suscripción one-time dura 1 mes

                       const { data, error } = await supabase
                           .from('suscripciones')
                           .upsert({
                               recruiter_id: recruiterId,
                               plan_id: planIdFromMetadata, // Establecer el plan one-time como principal si no hay otro
                               status: 'active',
                               trial_ends_at: null,
                               current_period_start: new Date().toISOString(),
                               current_period_end: endDate.toISOString(),
                               stripe_subscription_id: null,
                               cvs_analizados_este_periodo: 0, // Reiniciar contador para este nuevo período/plan
                               // Establecer los límites máximos del plan one-time
                               CV_Max_plan: additionalCvLimit,
                               Jobs_Max_plan: additionalJobLimit,
                           }, { onConflict: 'recruiter_id' });

                       if (error) {
                           console.error('❌ Supabase upsert error for new one-time subscription:', error);
                           throw new Error('Database error creating new subscription.');
                       }
                       console.log(`🎉 New one-time plan ${planIdFromMetadata} activated for user ${recruiterId} until ${endDate.toISOString()}.`);
                   }

               } catch (dbError) {
                 console.error('❌ Database operation failed during one-time payment processing:', dbError);
                 // Es crucial devolver un error 500 si la operación de BD falló después de un pago exitoso
                 return res.status(500).json({ error: { message: 'Database operation failed after successful payment.' } });
               }
           } else { // Este else maneja planes NO one-time PERO sin invoice/subscription (flujo de pago único para planes recurrentes, lo cual es inusual pero posible)
               // La lógica aquí podría necesitar revisión dependiendo de tu flujo de negocio.
               // Si un usuario paga por un plan recurrente sin crear una suscripción de Stripe,
               // podrías querer activar su plan por un período fijo aquí.
               // Sin embargo, el flujo recomendado de Stripe para recurrentes es vía customer.subscription.* eventos.
               console.warn(`⚠️ Received payment_intent.succeeded for non-one-time plan ${planIdFromMetadata} without associated subscription/invoice. RecruiterId: ${recruiterId}. This flow might be unintended.`);
               // Podrías loguear esto y no hacer nada, o intentar activar el plan por un período.
               // Si necesitas manejar esto, la lógica sería similar a la creación de una nueva suscripción one-time,
               // pero usando el planDetails del plan recurrente para calcular la fecha de fin y establecer CV_Max_plan y Jobs_Max_plan.
           }
      } else {
        console.warn('⚠️ PaymentIntent metadata missing recruiterId or planId:', paymentIntent.metadata);
      }
      break;
    } // Cerrar bloque case

    case 'customer.subscription.created': { // Usar bloque para scope
      const subscriptionCreated = event.data.object;
      console.log('✅ Subscription created:', subscriptionCreated.id);
      // Cuando se crea una suscripción (incluido el primer pago exitoso)
      const recruiterIdCreated = subscriptionCreated.metadata?.recruiterId || subscriptionCreated.customer; // Obtén recruiterId
      const stripeProductIdCreated = subscriptionCreated.items.data[0]?.price?.product; // Obtén el Product ID
      const planIdCreated = getPlanIdByStripeProductId(stripeProductIdCreated); // Mapea a tu ID interno

      if (recruiterIdCreated && planIdCreated) {
          try {
              // Obtener detalles del plan de suscripción
              const subscriptionPlanDetails = APP_PLANS[planIdCreated];
              const planCvLimit = subscriptionPlanDetails?.cvLimit || 0;
              const planJobLimit = subscriptionPlanDetails?.jobLimit || 0;

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
                      // Establecer los límites máximos del plan de suscripción
                      CV_Max_plan: planCvLimit,
                      Jobs_Max_plan: planJobLimit,
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
    } // Cerrar bloque case

    case 'customer.subscription.updated': { // Usar bloque para scope
      const subscriptionUpdated = event.data.object;
      console.log('✅ Subscription updated:', subscriptionUpdated.id);
      // Cuando se actualiza una suscripción (cambio de plan, estado, etc.)
      const recruiterIdUpdated = subscriptionUpdated.metadata?.recruiterId || subscriptionUpdated.customer;
      const stripeProductIdUpdated = subscriptionUpdated.items.data[0]?.price?.product;
      const planIdUpdated = getPlanIdByStripeProductId(stripeProductIdUpdated);

      if (recruiterIdUpdated && planIdUpdated) {
          try {
              // Obtener detalles del nuevo plan de suscripción
              const updatedSubscriptionPlanDetails = APP_PLANS[planIdUpdated];
              const updatedPlanCvLimit = updatedSubscriptionPlanDetails?.cvLimit || 0;
              const updatedPlanJobLimit = updatedSubscriptionPlanDetails?.jobLimit || 0;

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
                      // Actualizar los límites máximos al nuevo plan de suscripción
                      CV_Max_plan: updatedPlanCvLimit,
                      Jobs_Max_plan: updatedPlanJobLimit,
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
    } // Cerrar bloque case

    case 'customer.subscription.deleted': { // Usar bloque para scope
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
                      // Opcional: resetear límites máximos o establecer a los de un plan free si aplica
                      // CV_Max_plan: APP_PLANS['free']?.cvLimit || 0,
                      // Jobs_Max_plan: APP_PLANS['free']?.jobLimit || 0,
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
    } // Cerrar bloque case

    case 'invoice.paid': { // Usar bloque para scope
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
                         // Actualiza las fechas del período actual si es necesario (si no se maneja en subscription.updated)
                         // current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                         // current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                         // Opcional: Reiniciar el contador de CVs analizados para el nuevo período
                         // cvs_analizados_este_periodo: 0,
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
    } // Cerrar bloque case

    case 'payment_intent.payment_failed': { // Usar bloque para scope
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
    } // Cerrar bloque case

    // ... maneja otros tipos de eventos relevantes para tu aplicación
    default:
      // console.log(`Unhandled event type ${event.type}`); // Puedes comentar esto si hay muchos eventos no manejados
      break; // Añadir break al default
  }

  // Retorna un 200 para acusar recibo del evento
  res.status(200).json({ received: true });
};