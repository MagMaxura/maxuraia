// Archivo: api/paddle/webhooks.js
// Este archivo ha sido comentado temporalmente para reducir el número de funciones Serverless
// y ajustarse al límite del plan Hobby de Vercel durante la transición a Stripe.

/*
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { supabase } from '../../../src/lib/supabase.js';

// Asegúrate de que estas variables de entorno estén configuradas en tu servidor (Vercel)
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const PADDLE_ENV_STRING = process.env.PADDLE_ENV || 'sandbox';
const PADDLE_SDK_ENV = PADDLE_ENV_STRING === 'production' ? Environment.production : Environment.sandbox;

let paddleWebhookSdk;
if (PADDLE_API_KEY) {
    paddleWebhookSdk = new Paddle(PADDLE_API_KEY, {
        environment: PADDLE_SDK_ENV,
    });
    // Este log solo se ejecuta una vez cuando la función se carga/inicializa en frío
    console.log("SDK de Paddle (webhooks) instanciado para el entorno:", PADDLE_SDK_ENV);
} else {
    // Este log también se ejecuta solo una vez
    console.error("webhooks.js: PADDLE_API_KEY no está configurada. El SDK de Paddle no se puede instanciar.");
}

export const config = {
  api: {
    bodyParser: false, // Es obligatorio para webhooks firmados
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Logs que se ejecutan en cada invocación
  console.log("webhooks.js: Solicitud de webhook recibida. Método:", req.method);
  console.log("webhooks.js: PADDLE_API_KEY disponible en handler:", !!PADDLE_API_KEY);
  console.log("webhooks.js: PADDLE_WEBHOOK_SECRET disponible en handler:", !!PADDLE_WEBHOOK_SECRET);


  if (!paddleWebhookSdk) {
    console.error("webhooks.js: El SDK de Paddle no está disponible en el handler (PADDLE_API_KEY podría faltar).");
    return res.status(500).json({ message: 'Error de configuración del servidor: SDK de Paddle no disponible.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const rawBody = await buffer(req);
  const bodyString = rawBody.toString();
  const signature = req.headers['paddle-signature'];

  if (!signature || !PADDLE_WEBHOOK_SECRET) {
    console.warn('webhooks.js - Falta firma o PADDLE_WEBHOOK_SECRET. Firma:', !!signature, 'Secreto:', !!PADDLE_WEBHOOK_SECRET);
    return res.status(400).json({ message: 'Falta la firma del webhook o el secreto.' });
  }

  let event;
  try {
    event = await paddleWebhookSdk.webhooks.unmarshal(bodyString, PADDLE_WEBHOOK_SECRET, signature);
    console.log(`webhooks.js - Evento de Paddle verificado: ${event.eventType}, ID del Evento: ${event.eventId}`);
  } catch (err) {
    console.error('webhooks.js - Error al verificar la firma del webhook:', err.message);
    console.error("webhooks.js - Request body string (falló unmarshal):", bodyString);
    return res.status(400).json({ message: `Error de verificación de Webhook: ${err.message}. Asegúrate que PADDLE_WEBHOOK_SECRET esté correctamente configurado.` });
  }

  try {
    // Parseo flexible de custom_data
    const rawCustomDataObject = event.data.customData || event.data.custom_data || {}; // Probar customData (camelCase) y custom_data (snake_case)
    let recruiterId;

    if (typeof rawCustomDataObject === 'string') {
        try {
            const parsedString = JSON.parse(rawCustomDataObject);
            recruiterId = parsedString.recruiter_id || parsedString.recruiterId || parsedString.user_id;
        } catch (e) {
            console.warn('webhooks.js - custom_data era un string pero no pudo ser parseado como JSON:', rawCustomDataObject);
            recruiterId = undefined;
        }
    } else { // Es un objeto
        recruiterId = rawCustomDataObject.recruiter_id || rawCustomDataObject.recruiterId || rawCustomDataObject.user_id;
    }
    console.log('webhooks.js - recruiterId extraído de customData:', recruiterId);
    
    const eventPaddleSubscriptionId = event.data.id; // Para eventos subscription.*
    const transactionRelatedSubscriptionId = event.data.subscription_id; // Para transaction.* relacionadas a una sub

    console.log(`webhooks.js - Procesando evento: ${event.eventType}. RecruiterID: ${recruiterId}. PaddleSubscriptionID del evento: ${eventPaddleSubscriptionId || 'N/A'}. SubscriptionID relacionada a txn: ${transactionRelatedSubscriptionId || 'N/A'}`);

    switch (event.eventType) {
      case 'transaction.completed':
        console.log('webhooks.js - transaction.completed. Datos:', JSON.stringify(event.data, null, 2));
        const planIdTransaction = event.data.items[0]?.price?.product_id;

        if (!planIdTransaction) {
            console.error('webhooks.js - transaction.completed: No se pudo obtener planIdTransaction (product_id).');
            break;
        }
        try {
            let query;
            const updatePayloadTransaction = {
                plan_id: planIdTransaction,
                status: 'active', // Considera si esto siempre es deseable o si depende del estado de la suscripción
            };

            if (transactionRelatedSubscriptionId) {
                console.log(`webhooks.js - transaction.completed para suscripción ID: ${transactionRelatedSubscriptionId}`);
                query = supabase.from('suscripciones')
                                .update(updatePayloadTransaction)
                                .eq('paddle_subscription_id', transactionRelatedSubscriptionId);
            } else if (recruiterId) {
                console.log(`webhooks.js - transaction.completed (no-suscripción/pago único) para recruiterId: ${recruiterId}`);
                query = supabase.from('suscripciones')
                                .update(updatePayloadTransaction)
                                .eq('recruiter_id', recruiterId);
            } else {
                console.warn('webhooks.js - transaction.completed: No ID de suscripción ni recruiterId para asociar.');
                break;
            }
            const { data: dbDataTx, error: dbErrorTx } = await query;
            if (dbErrorTx) console.error('webhooks.js - transaction.completed: Error al actualizar BD:', dbErrorTx);
            else console.log('webhooks.js - transaction.completed: BD actualizada.', dbDataTx);
        } catch (dbError) {
            console.error('webhooks.js - transaction.completed: Excepción al interactuar con Supabase:', dbError);
        }
        break;

      case 'subscription.created':
        console.log('webhooks.js - subscription.created. ID Paddle:', eventPaddleSubscriptionId, 'Datos:', JSON.stringify(event.data, null, 2));
        const planIdCreated = event.data.items[0]?.price?.product_id;
        const initialStatus = event.data.status || 'active';

        if (!recruiterId) {
            console.error('webhooks.js - subscription.created: Falta recruiterId. No se puede crear la suscripción en la BD.');
            break;
        }
        if (!planIdCreated) {
            console.error('webhooks.js - subscription.created: No se pudo obtener planIdCreated (product_id).');
            break;
        }
        try {
          const { data: dbDataCreated, error: dbErrorCreated } = await supabase
            .from('suscripciones')
            .insert({
              recruiter_id: recruiterId,
              plan_id: planIdCreated,
              status: initialStatus,
              paddle_subscription_id: eventPaddleSubscriptionId,
            });
          if (dbErrorCreated) console.error('webhooks.js - subscription.created: Error al insertar en BD:', dbErrorCreated);
          else console.log('webhooks.js - subscription.created: Suscripción insertada en BD.', dbDataCreated);
        } catch (dbError) {
          console.error('webhooks.js - subscription.created: Excepción al interactuar con Supabase:', dbError);
        }
        break;

      case 'subscription.updated':
      case 'subscription.canceled':
      case 'subscription.paused':
      case 'subscription.resumed':
        console.log(`webhooks.js - Evento: ${event.eventType}. ID Paddle: ${eventPaddleSubscriptionId}. Status Paddle: ${event.data.status}. Datos:`, JSON.stringify(event.data, null, 2));
        const planIdForUpdate = event.data.items[0]?.price?.product_id;
        const newStatusFromPaddle = event.data.status;

        if (!eventPaddleSubscriptionId) {
            console.error(`webhooks.js - ${event.eventType}: Falta paddle_subscription_id. No se puede actualizar.`);
            break;
        }

        try {
            const updatePayloadSubscription = { status: newStatusFromPaddle };
            // Solo actualiza plan_id si está presente y es un evento de update o resume
            if (planIdForUpdate && (event.eventType === 'subscription.updated' || event.eventType === 'subscription.resumed')) {
                updatePayloadSubscription.plan_id = planIdForUpdate;
            }
            // Lógica específica para 'subscription.resumed'
            if (event.eventType === 'subscription.resumed') {
                // Solo resetea 'cvs_analizados_este_periodo' si NO viene en custom_data del evento.
                // Asumiendo que si viene en custom_data, ese valor tiene precedencia.
                const eventCustomData = event.data.customData || event.data.custom_data || {};
                if (typeof eventCustomData.cvs_analizados_este_periodo === 'undefined') {
                    updatePayloadSubscription.cvs_analizados_este_periodo = 0;
                }
            }

            const { data: dbDataUpdated, error: dbErrorUpdated } = await supabase
                .from('suscripciones')
                .update(updatePayloadSubscription)
                .eq('paddle_subscription_id', eventPaddleSubscriptionId);

            if (dbErrorUpdated) console.error(`webhooks.js - ${event.eventType}: Error al actualizar BD:`, dbErrorUpdated);
            else console.log(`webhooks.js - ${event.eventType}: BD actualizada.`, dbDataUpdated);
        } catch (dbError) {
            console.error(`webhooks.js - ${event.eventType}: Excepción al interactuar con Supabase:`, dbError);
        }
        break;

      default:
        console.log(`webhooks.js - Evento no manejado: ${event.eventType}, Datos: ${JSON.stringify(event.data, null, 2)}`);
    }

    res.status(200).json({ received: true });
  } catch (processingError) {
    console.error('webhooks.js - Error crítico al procesar el evento del webhook:', processingError.message, processingError.stack);
    res.status(500).json({ message: 'Error interno del servidor al procesar el webhook.' });
  }
}
*/
"use strict";