import Stripe from 'stripe';
import { buffer } from 'micro'; // Necesario para leer el cuerpo crudo de la solicitud
import { createClient } from '@supabase/supabase-js'; // Importa Supabase
import { APP_PLANS } from './_lib/plans.js'; // Ruta corregida después de mover el archivo

// Asegúrate de tener tus claves de Stripe y Supabase en las variables de entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Usa la versión de API más reciente o la que prefieras
});

// Helper para añadir meses a una fecha (definición global)
const addMonthsUTC = (date, months) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

// Inicializa el cliente de Supabase
let supabase;
try {
  console.log('DEBUG: SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'Missing');
  console.log('DEBUG: SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Present' : 'Missing');
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Usa la Service Key para acceso con privilegios en el backend
  );
} catch (initError) {
  console.error('FATAL_ERROR: Error initializing Supabase client:', initError);
  // En un entorno de producción, esto debería ser un error crítico.
  // Aquí, simplemente lo logueamos y permitimos que la función continúe,
  // pero las operaciones de BD subsiguientes fallarán.
}

// Función para mapear Stripe Product ID a tu plan interno ID
const getPlanByStripeProductId = (stripeProductId) => {
    return Object.values(APP_PLANS).find(p => p.stripeProductId === stripeProductId);
};

// Función para mapear Stripe Price ID a tu plan interno (objeto completo)
const getPlanByStripePriceId = (stripePriceId) => {
    return Object.values(APP_PLANS).find(p => p.stripePriceId === stripePriceId);
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
      const { recruiterId, planId: planIdFromMetadata } = paymentIntent.metadata; // planId aquí es tu ID interno (ej: 'busqueda_puntual')

      // Verificar que los datos esenciales de la metadata estén presentes
      if (!recruiterId || !planIdFromMetadata) {
          console.error('❌ Missing required metadata in payment_intent.succeeded event:', paymentIntent.metadata);
          return res.status(400).json({ error: { message: 'Missing required metadata (recruiterId or planId).' } });
      }

      // Si el PaymentIntent está asociado a una suscripción, la lógica principal se maneja en customer.subscription.*
      // Si no está asociado a una suscripción, podría ser un pago único.
      if (paymentIntent.invoice || paymentIntent.subscription) {
          console.log(`ℹ️ PaymentIntent ${paymentIntent.id} is associated with a subscription/invoice. Handled by other events.`);
      } else { // Este bloque maneja pagos únicos (no asociados a suscripciones/facturas)
          const oneTimePlanDetails = APP_PLANS[planIdFromMetadata]; // Obtener detalles del plan
          const isOneTimePayment = oneTimePlanDetails && oneTimePlanDetails.type === 'one-time';

          if (isOneTimePayment) {
               try {
                   const additionalCvLimit = oneTimePlanDetails.cvLimit || 0;
                   const additionalJobLimit = oneTimePlanDetails.jobLimit || 0;

                   // Consultar el registro de suscripción existente
                   const { data: existingSubscription, error: fetchError } = await supabase
                       .from('suscripciones')
                       .select('plan_id, CV_Max_plan, Jobs_Max_plan, one_time_cv_bonus, one_time_job_bonus, one_time_match_bonus') // Incluir nuevos campos
                       .eq('recruiter_id', recruiterId)
                       .maybeSingle(); // Usar maybeSingle para manejar caso de no encontrar

                   if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 es "No rows found"
                       console.error('❌ Supabase fetch error checking for existing subscription (payment_intent.succeeded):', fetchError);
                       console.error('DEBUG: Supabase fetch error details (payment_intent.succeeded):', fetchError);
                       throw new Error('Database error checking subscription.');
                   }

                   let updateData = {};
                   let newSubscriptionData = {};
                   const now = new Date(); // Fecha actual en la zona horaria del servidor
                   const nowUtc = new Date(now.toUTCString()); // Convertir a UTC

                   if (existingSubscription) {
                       console.log(`ℹ️ Existing subscription found for user ${recruiterId}. Adding one-time plan limits as bonus.`);
                       updateData = {
                           one_time_cv_bonus: (existingSubscription.one_time_cv_bonus || 0) + additionalCvLimit,
                           one_time_job_bonus: (existingSubscription.one_time_job_bonus || 0) + additionalJobLimit,
                           one_time_match_bonus: (existingSubscription.one_time_match_bonus || 0) + (oneTimePlanDetails.matchLimit || 0), // Añadir el bono de macheos
                       };
                       // Si el plan existente es puntual, extender el current_period_end
                       if (existingSubscription.plan_id && APP_PLANS[existingSubscription.plan_id]?.type === 'one-time') {
                         updateData.current_period_end = addMonthsUTC(nowUtc, 1).toISOString(); // Siempre desde la fecha de compra (UTC)
                         updateData.status = 'active'; // Asegurar que el estado sea activo
                         updateData.plan_id = planIdFromMetadata; // Mantener el plan puntual como principal
                       } else if (existingSubscription.plan_id && APP_PLANS[existingSubscription.plan_id]?.type !== 'one-time') {
                         // Si tiene un plan mensual, no se modifica el current_period_end ni el plan_id
                         // Los bonos se suman y se reiniciarán con el ciclo mensual.
                         console.log(`ℹ️ User ${recruiterId} with monthly plan purchased one-time plan. Bonuses added.`);
                       }

                       const { error: updateError } = await supabase
                           .from('suscripciones')
                           .update(updateData)
                           .eq('recruiter_id', recruiterId);

                       if (updateError) {
                           console.error('❌ Supabase update error adding one-time limits (payment_intent.succeeded):', updateError);
                           console.error('DEBUG: Supabase update error details (payment_intent.succeeded):', updateError);
                           throw new Error('Database error updating subscription with additional limits.');
                       }
                       console.log(`🎉 Added ${additionalCvLimit} CVs and ${additionalJobLimit} jobs as bonus to existing subscription for user ${recruiterId}.`);

                   } else {
                       console.log(`ℹ️ No existing subscription found for user ${recruiterId}. Creating new subscription with one-time plan as base.`);
                       newSubscriptionData = {
                           recruiter_id: recruiterId,
                           plan_id: planIdFromMetadata, // El plan puntual es el principal si no hay otro
                           status: 'active',
                           trial_ends_at: null,
                           current_period_start: nowUtc.toISOString(),
                           current_period_end: addMonthsUTC(nowUtc, 1).toISOString(), // Válido por 1 mes (UTC)
                           stripe_subscription_id: null,
                           cvs_analizados_este_periodo: 0,
                           CV_Max_plan: 0, // Los límites base son 0, los límites del plan puntual van a los bonos
                           Jobs_Max_plan: 0,
                           one_time_cv_bonus: additionalCvLimit, // Los límites del plan puntual se guardan como bonos
                           one_time_job_bonus: additionalJobLimit,
                           one_time_match_bonus: oneTimePlanDetails.matchLimit || 0, // Los límites de macheos del plan puntual se guardan como bonos
                       };
                       console.log('DEBUG: New subscription data for one-time plan (payment_intent.succeeded):', newSubscriptionData);

                       const { error: insertError } = await supabase
                           .from('suscripciones')
                           .insert([newSubscriptionData]);

                       if (insertError) {
                           console.error('❌ Supabase insert error for new one-time subscription (payment_intent.succeeded):', insertError);
                           console.error('DEBUG: Supabase insert error details (payment_intent.succeeded):', insertError);
                           throw new Error('Database error creating new subscription.');
                       }
                       console.log(`🎉 New subscription created with one-time plan ${planIdFromMetadata} as base for user ${recruiterId}.`);
                   }
               } catch (dbError) {
                 console.error('❌ Database operation failed during one-time payment processing (payment_intent.succeeded):', dbError);
                 console.error('DEBUG: Supabase error details (payment_intent.succeeded general catch):', dbError);
                 return res.status(500).json({ error: { message: 'Database operation failed after successful payment.' } });
               }
           } else { // Este else maneja planes NO one-time PERO sin invoice/subscription (flujo de pago único para planes recurrentes, lo cual es inusual pero posible)
               console.warn(`⚠️ Received payment_intent.succeeded for non-one-time plan ${planIdFromMetadata} without associated subscription/invoice. RecruiterId: ${recruiterId}. This flow might be unintended.`);
           }
       }
       break;
     }

    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('✅ Checkout Session completed:', session.id);
      console.log('DEBUG: Full Checkout Session object:', JSON.stringify(session, null, 2));

      const { recruiterId, planId: planIdFromMetadata } = session.metadata;

      if (session.payment_status === 'paid' && recruiterId && planIdFromMetadata) {
        const purchasedPlanDetails = APP_PLANS[planIdFromMetadata];

        if (!purchasedPlanDetails) {
          console.error(`❌ Plan no encontrado para planId: ${planIdFromMetadata}`);
          return res.status(400).json({ error: { message: 'Plan no encontrado.' } });
        }

        try {
          const { data: existingSubscription, error: fetchError } = await supabase
            .from('suscripciones')
            .select('*') // Seleccionar todos los campos para una lógica más completa
            .eq('recruiter_id', recruiterId)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('❌ Supabase fetch error checking for existing subscription (checkout.session.completed):', fetchError);
            console.error('DEBUG: Supabase fetch error details:', fetchError); // Nuevo log
            throw new Error('Database error checking subscription.');
          }

          let updateData = {};
          let newSubscriptionData = {};
          const now = new Date(); // Fecha actual en la zona horaria del servidor
          const nowUtc = new Date(now.toUTCString()); // Convertir a UTC

          if (purchasedPlanDetails.type === 'one-time') { // Lógica para planes puntuales
            const additionalCvLimit = purchasedPlanDetails.cvLimit || 0;
            const additionalJobLimit = purchasedPlanDetails.jobLimit || 0;
            const additionalMatchLimit = purchasedPlanDetails.matchLimit || 0; // Nuevo: Límite de macheos
 
 
            if (existingSubscription) {
              // Usuario con plan existente (puntual o mensual) compra otro plan puntual
              console.log(`ℹ️ Existing subscription found for user ${recruiterId}. Adding one-time plan limits as bonus.`);
              
              // Si el plan existente es mensual, los bonos se suman y se reinician al final del periodo.
              // Si el plan existente es puntual, se suman los bonos y se extiende el periodo.
              updateData = {
                one_time_cv_bonus: (existingSubscription.one_time_cv_bonus || 0) + additionalCvLimit,
                one_time_job_bonus: (existingSubscription.one_time_job_bonus || 0) + additionalJobLimit,
                one_time_match_bonus: (existingSubscription.one_time_match_bonus || 0) + additionalMatchLimit, // Añadir el bono de macheos
              };

              // Si el plan existente es puntual, extender el current_period_end desde la fecha actual (UTC)
              if (existingSubscription.plan_id && APP_PLANS[existingSubscription.plan_id]?.type === 'one-time') {
                updateData.current_period_end = addMonthsUTC(nowUtc, 1).toISOString(); // Siempre desde la fecha de compra (UTC)
                updateData.status = 'active'; // Asegurar que el estado sea activo
                updateData.plan_id = purchasedPlanDetails.id; // Mantener el plan puntual como principal
              } else if (existingSubscription.plan_id && APP_PLANS[existingSubscription.plan_id]?.type !== 'one-time') {
                // Si tiene un plan mensual, no se modifica el current_period_end ni el plan_id
                // Los bonos se suman y se reiniciarán con el ciclo mensual.
                console.log(`ℹ️ User ${recruiterId} with monthly plan purchased one-time plan. Bonuses added.`);
              }

              const { error: updateError } = await supabase
                .from('suscripciones')
                .update(updateData)
                .eq('recruiter_id', recruiterId);

              if (updateError) {
                console.error('❌ Supabase update error adding one-time limits (checkout.session.completed):', updateError);
                console.error('DEBUG: Supabase update error details:', updateError); // Nuevo log
                throw new Error('Database error updating subscription with additional limits.');
              }
              console.log(`🎉 Added ${additionalCvLimit} CVs and ${additionalJobLimit} jobs as bonus to existing subscription for user ${recruiterId}.`);

            } else {
              // Usuario sin plan compra un plan puntual
              console.log(`ℹ️ No existing subscription found for user ${recruiterId}. Creating new subscription with one-time plan as base.`);
              newSubscriptionData = {
                recruiter_id: recruiterId,
                plan_id: purchasedPlanDetails.id,
                status: 'active',
                trial_ends_at: null,
                current_period_start: nowUtc.toISOString(),
                current_period_end: addMonthsUTC(nowUtc, 1).toISOString(), // Válido por 1 mes (UTC)
                stripe_subscription_id: null,
                cvs_analizados_este_periodo: 0,
                CV_Max_plan: 0, // Los límites base son 0 para planes one-time
                Jobs_Max_plan: 0,
                one_time_cv_bonus: additionalCvLimit,
                one_time_job_bonus: additionalJobLimit,
                one_time_match_bonus: additionalMatchLimit, // Los límites de macheos del plan puntual se guardan como bonos
              };
              console.log('DEBUG: New subscription data for one-time plan (checkout.session.completed):', newSubscriptionData);

              const { error: insertError } = await supabase
                .from('suscripciones')
                .insert([newSubscriptionData]);

              if (insertError) {
                console.error('❌ Supabase insert error for new one-time subscription (checkout.session.completed):', insertError);
                console.error('DEBUG: Supabase insert error details:', insertError); // Nuevo log
                throw new Error('Database error creating new subscription.');
              }
              console.log(`🎉 New subscription created with one-time plan ${planIdFromMetadata} as base for user ${recruiterId}.`);
            }
          } else if (purchasedPlanDetails.type === 'monthly' || purchasedPlanDetails.type === 'enterprise') { // Lógica para planes mensuales/empresariales
            console.log(`ℹ️ User ${recruiterId} purchased a ${purchasedPlanDetails.type} plan.`);
            
            const currentPeriodStart = nowUtc.toISOString();
            const currentPeriodEnd = addMonthsUTC(nowUtc, 1).toISOString(); // 1 mes de validez (UTC)

            let cvBonusToCarryOver = 0;
            let jobBonusToCarryOver = 0;

            if (existingSubscription) {
                cvBonusToCarryOver = existingSubscription.one_time_cv_bonus || 0;
                jobBonusToCarryOver = existingSubscription.one_time_job_bonus || 0;
                console.log(`ℹ️ Carrying over existing one-time bonuses: CVs=${cvBonusToCarryOver}, Jobs=${jobBonusToCarryOver}`);
            }

            updateData = {
                recruiter_id: recruiterId,
                plan_id: purchasedPlanDetails.id,
                status: 'active',
                trial_ends_at: null, // Asumimos que no hay trial si ya pagó
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                stripe_subscription_id: session.subscription || null, // Guarda el ID de suscripción si es recurrente
                cvs_analizados_este_periodo: 0,
                jobs_creados_este_periodo: 0,
                CV_Max_plan: purchasedPlanDetails.cvLimit,
                Jobs_Max_plan: purchasedPlanDetails.jobLimit,
                one_time_cv_bonus: cvBonusToCarryOver, // Mantener bonos existentes
                one_time_job_bonus: jobBonusToCarryOver, // Mantener bonos existentes
            };

            const { error: upsertError } = await supabase
                .from('suscripciones')
                .upsert(updateData, { onConflict: 'recruiter_id', ignoreDuplicates: false });

            if (upsertError) {
                console.error('❌ Supabase upsert error for monthly/enterprise plan (checkout.session.completed):', upsertError);
                throw new Error('Database error updating subscription for monthly/enterprise plan.');
            }
            console.log(`🎉 Subscription for user ${recruiterId} updated/created to ${purchasedPlanDetails.id} plan.`);

          } else {
            console.warn(`⚠️ Checkout Session completed for unhandled mode or plan type: ${session.mode}, Plan ID: ${planIdFromMetadata}`);
          }
        } catch (dbError) {
          console.error('❌ Database operation failed during checkout.session.completed processing:', dbError);
          console.error('DEBUG: Supabase error details (general catch):', dbError); // Nuevo log
          return res.status(500).json({ error: { message: 'Database operation failed after successful payment.' } });
        }
      } else {
        console.warn('⚠️ Checkout Session completed event missing required data or not paid:', session);
      }
      break;
    }

     case 'customer.subscription.created': { // Usar bloque para scope
       const subscriptionCreated = event.data.object;
       console.log('✅ Subscription created:', subscriptionCreated.id);
       console.log('DEBUG: Full subscriptionCreated object:', JSON.stringify(subscriptionCreated, null, 2)); // Añadir este log
       // Cuando se crea una suscripción (incluido el primer pago exitoso)
       const recruiterIdCreated = subscriptionCreated.metadata?.recruiterId || subscriptionCreated.customer; // Obtén recruiterId
       const stripeProductIdCreated = subscriptionCreated.items.data[0]?.price?.product; // Obtén el Product ID
       const subscriptionPlanDetails = getPlanByStripeProductId(stripeProductIdCreated); // Mapea a tu ID interno (objeto completo)

       if (recruiterIdCreated && subscriptionPlanDetails) {
           try {
               // Obtener la suscripción existente para mantener los bonos puntuales
               const { data: existingSubscription, error: fetchError } = await supabase
                   .from('suscripciones')
                   .select('one_time_cv_bonus, one_time_job_bonus, one_time_match_bonus')
                   .eq('recruiter_id', recruiterIdCreated)
                   .maybeSingle();

               if (fetchError && fetchError.code !== 'PGRST116') {
                   console.error('❌ Supabase fetch error checking for existing subscription (created event):', fetchError);
                   throw new Error('Database error checking subscription.');
               }

               const oneTimeCvBonus = existingSubscription?.one_time_cv_bonus || 0;
               const oneTimeJobBonus = existingSubscription?.one_time_job_bonus || 0;
               const oneTimeMatchBonus = existingSubscription?.one_time_match_bonus || 0; // Obtener bono de macheos existente
 


               // Crea o actualiza la suscripción en tu base de datos
               const { data, error } = await supabase
                   .from('suscripciones')
                   .upsert({ // Usar upsert para insertar o actualizar si ya existe por recruiter_id
                       recruiter_id: recruiterIdCreated,
                       plan_id: subscriptionPlanDetails.id, // Establecer el nuevo plan mensual como principal
                       status: subscriptionCreated.status, // 'trialing', 'active', etc.
                       stripe_subscription_id: subscriptionCreated.id, // Guarda el ID de suscripción de Stripe
                       current_period_start: new Date(subscriptionCreated.current_period_start * 1000).toISOString(),
                       current_period_end: new Date(subscriptionCreated.current_period_end * 1000).toISOString(),
                       trial_ends_at: subscriptionCreated.trial_end ? new Date(subscriptionCreated.trial_end * 1000).toISOString() : null,
                       cvs_analizados_este_periodo: 0, // Reiniciar contador
                       CV_Max_plan: subscriptionPlanDetails.cvLimit, // Límites base del plan mensual
                       Jobs_Max_plan: subscriptionPlanDetails.jobLimit, // Límites base del plan mensual
                       one_time_cv_bonus: oneTimeCvBonus, // Mantener los bonos existentes
                       one_time_job_bonus: oneTimeJobBonus, // Mantener los bonos existentes
                   }, { onConflict: 'recruiter_id', ignoreDuplicates: false }); // Conflict on recruiter_id

                   if (error) {
                       console.error('❌ Supabase upsert error for subscription.created:', error);
                       console.error('DEBUG: Supabase upsert error details (created):', error); // Nuevo log
                   } else {
                       console.log(`🎉 Subscription ${subscriptionCreated.id} created/updated for user ${recruiterIdCreated} with plan ${subscriptionPlanDetails.id}.`);
                   }
               } catch (dbError) {
                   console.error('❌ Database operation failed for subscription.created:', dbError);
                   console.error('DEBUG: Supabase error details (created):', dbError); // Nuevo log
               }
           } else {
               console.warn('⚠️ Subscription created event missing recruiterId or Product ID:', subscriptionCreated);
           }
           break;
         }

         case 'customer.subscription.updated': { // Usar bloque para scope
           const subscriptionUpdated = event.data.object;
           console.log('✅ Subscription updated:', subscriptionUpdated.id);
           // Cuando se actualiza una suscripción (cambio de plan, estado, etc.)
           const recruiterIdUpdated = subscriptionUpdated.metadata?.recruiterId || subscriptionUpdated.customer;
           const stripeProductIdUpdated = subscriptionUpdated.items.data[0]?.price?.product;
           const updatedSubscriptionPlanDetails = getPlanByStripeProductId(stripeProductIdUpdated); // Obtener objeto completo del plan

           if (recruiterIdUpdated && updatedSubscriptionPlanDetails) {
               try {
                   // Obtener la suscripción existente para mantener los bonos puntuales
                   const { data: existingSubscription, error: fetchError } = await supabase
                       .from('suscripciones')
                       .select('one_time_cv_bonus, one_time_job_bonus, one_time_match_bonus')
                       .eq('recruiter_id', recruiterIdUpdated)
                       .maybeSingle();

                   if (fetchError && fetchError.code !== 'PGRST116') {
                       console.error('❌ Supabase fetch error checking for existing subscription (updated event):', fetchError);
                       throw new Error('Database error checking subscription.');
                   }

                   const oneTimeCvBonus = existingSubscription?.one_time_cv_bonus || 0;
                   const oneTimeJobBonus = existingSubscription?.one_time_job_bonus || 0;

                   const oneTimeMatchBonus = existingSubscription?.one_time_match_bonus || 0; // Obtener bono de macheos existente


                   const { data, error } = await supabase
                       .from('suscripciones')
                       .update({
                           plan_id: updatedSubscriptionPlanDetails.id, // Establecer el nuevo plan mensual como principal
                           status: subscriptionUpdated.status,
                           current_period_start: new Date(subscriptionUpdated.current_period_start * 1000).toISOString(),
                           current_period_end: new Date(subscriptionUpdated.current_period_end * 1000).toISOString(),
                           trial_ends_at: subscriptionUpdated.trial_end ? new Date(subscriptionUpdated.trial_end * 1000).toISOString() : null,
                           cvs_analizados_este_periodo: 0, // Reiniciar contador de CVs
                           CV_Max_plan: updatedSubscriptionPlanDetails.cvLimit, // Límites base del plan mensual
                           Jobs_Max_plan: updatedSubscriptionPlanDetails.jobLimit, // Límites base del plan mensual
                           one_time_cv_bonus: 0, // Reiniciar bonos puntuales a 0
                           one_time_job_bonus: 0, // Reiniciar bonos puntuales a 0
                           one_time_match_bonus: 0, // Reiniciar bonos de macheos puntuales a 0
                       })
                       .eq('recruiter_id', recruiterIdUpdated);

                   if (error) {
                       console.error('❌ Supabase update error for subscription.updated:', error);
                       console.error('DEBUG: Supabase update error details (updated):', error); // Nuevo log
                   } else {
                       console.log(`🎉 Subscription ${subscriptionUpdated.id} updated for user ${recruiterIdUpdated} to plan ${updatedSubscriptionPlanDetails.id}.`);
                   }
               } catch (dbError) {
                   console.error('❌ Database operation failed for subscription.updated:', dbError);
                   console.error('DEBUG: Supabase error details (updated):', dbError); // Nuevo log
               }
           } else {
               console.warn('⚠️ Subscription updated event missing recruiterId or Product ID:', subscriptionUpdated);
           }
           break;
         }

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
                   console.error('DEBUG: Supabase update error details (deleted):', error); // Nuevo log
               } else {
                   console.log(`🎉 Subscription ${subscriptionDeleted.id} deleted for user ${recruiterIdDeleted}.`);
               }
           } catch (dbError) {
               console.error('❌ Database operation failed for subscription.deleted:', dbError);
               console.error('DEBUG: Supabase error details (deleted):', dbError); // Nuevo log
             }
         } else {
             console.warn('⚠️ Subscription deleted event missing recruiterId:', subscriptionDeleted);
         }
         break;
       }

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
                          cvs_analizados_este_periodo: 0, // Reiniciar contador de CVs
                          jobs_creados_este_periodo: 0, // Reiniciar contador de puestos
                          one_time_cv_bonus: 0, // Reiniciar bonos puntuales a 0
                          one_time_job_bonus: 0, // Reiniciar bonos puntuales a 0
                      })
                      .eq('recruiter_id', recruiterIdFromInvoice); // O usar stripe_subscription_id

                  if (error) {
                      console.error('❌ Supabase update error for invoice.paid:', error);
                      console.error('DEBUG: Supabase update error details (invoice.paid):', error); // Nuevo log
                  } else {
                      console.log(`🎉 Subscription for user ${recruiterIdFromInvoice} confirmed active via invoice ${invoice.id}.`);
                  }
              } catch (dbError) {
                  console.error('❌ Database operation failed for invoice.paid:', dbError);
                  console.error('DEBUG: Supabase error details (invoice.paid):', dbError); // Nuevo log
              }
         } else {
             console.warn('⚠️ Invoice paid event missing recruiterId or subscriptionId:', invoice);
         }
         break;
       }

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
                     console.error('DEBUG: Supabase update error details (payment_failed):', error); // Nuevo log
                 } else {
                     console.log(`⚠️ Subscription for user ${recruiterIdFailed} marked as past_due.`);
                 }
             } catch (dbError) {
                 console.error('❌ Database operation failed for payment_intent.payment_failed:', dbError);
                 console.error('DEBUG: Supabase error details (payment_failed):', dbError); // Nuevo log
             }
         }
         break;
     }

     // ... maneja otros tipos de eventos relevantes para tu aplicación
     default:
       // console.log(`Unhandled event type ${event.type}`); // Puedes comentar esto si hay muchos eventos no manejados
       break; // Añadir break al default
   }

   // Retorna un 200 para acusar recibo del evento
   res.status(200).json({ received: true });
};