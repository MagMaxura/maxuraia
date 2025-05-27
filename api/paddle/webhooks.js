// Archivo: pages/api/paddle/webhooks.js (o la ruta que corresponda)

import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { supabase } from '@/lib/supabase'; // Ajusta la ruta si es necesario

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const PADDLE_ENV_STRING = process.env.PADDLE_ENV || 'sandbox';
const PADDLE_SDK_ENV = PADDLE_ENV_STRING === 'production' ? Environment.production : Environment.sandbox;

let paddleWebhookSdk; // Similar al otro endpoint, manejo de instancia del SDK
if (PADDLE_API_KEY) {
    paddleWebhookSdk = new Paddle(PADDLE_API_KEY, {
        environment: PADDLE_SDK_ENV,
    });
    console.log("SDK de Paddle (webhooks) inicializado para el entorno:", PADDLE_SDK_ENV);
} else {
    console.error("webhooks.js: PADDLE_API_KEY no está configurada. El SDK de Paddle no se puede inicializar.");
}

export const config = {
  api: {
    bodyParser: false,
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
  console.log("webhooks.js - Nueva solicitud de webhook recibida. Método:", req.method);
  if (!paddleWebhookSdk) {
    console.error("webhooks.js: El SDK de Paddle no está inicializado (falta API Key).");
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
    console.warn('webhooks - Falta firma o secreto de webhook.');
    return res.status(400).json({ message: 'Falta la firma del webhook o el secreto.' });
  }

  let event;
  try {
    event = await paddleWebhookSdk.webhooks.unmarshal(bodyString, PADDLE_WEBHOOK_SECRET, signature);
    console.log(`webhooks - Evento de Paddle verificado: ${event.eventType}, ID del Evento: ${event.eventId}`);
  } catch (err) {
    console.error('webhooks - Error al verificar la firma del webhook:', err.message);
    console.error("webhooks - Request body string (falló unmarshal):", bodyString);
    return res.status(400).json({ message: `Error de verificación de Webhook: ${err.message}` });
  }

  try {
    const customData = event.data.custom_data || {};
    let recruiterId =
      customData.recruiter_id ||
      customData.user_id || 
      (typeof customData === 'string' ? JSON.parse(customData).recruiter_id : undefined);
    
    // ID de suscripción de Paddle (presente en eventos de suscripción y transacciones de suscripción)
    const eventPaddleSubscriptionId = event.data.id; // Para eventos subscription.*
    const transactionRelatedSubscriptionId = event.data.subscription_id; // Para transaction.* relacionadas a una sub

    console.log(`webhooks - Procesando evento: ${event.eventType}. RecruiterID de custom_data: ${recruiterId}. PaddleSubscriptionID del evento: ${eventPaddleSubscriptionId || 'N/A'}. SubscriptionID relacionada a transacción: ${transactionRelatedSubscriptionId || 'N/A'}`);

    switch (event.eventType) {
      case 'transaction.completed':
        console.log('webhooks - Transacción completada. Datos:', JSON.stringify(event.data, null, 2));
        const planIdTransaction = event.data.items[0]?.price?.product_id;

        if (!planIdTransaction) {
            console.error('webhooks - transaction.completed: No se pudo obtener planIdTransaction (product_id).');
            break; 
        }

        try {
            let query;
            const updatePayload = { 
                plan_id: planIdTransaction, 
                // Considera qué status es apropiado aquí. 'active' es una suposición fuerte.
                // Podrías querer solo actualizar fechas de pago o depender de eventos subscription.*
                status: 'active', 
            };

            if (transactionRelatedSubscriptionId) {
                console.log(`webhooks - transaction.completed para suscripción ID: ${transactionRelatedSubscriptionId}`);
                query = supabase.from('suscripciones')
                                .update(updatePayload)
                                .eq('paddle_subscription_id', transactionRelatedSubscriptionId);
            } else if (recruiterId) {
                console.log(`webhooks - transaction.completed (no-suscripción/pago único) para recruiterId: ${recruiterId}`);
                query = supabase.from('suscripciones') 
                                .update(updatePayload) // Asume que existe un registro para este recruiter y se activa.
                                .eq('recruiter_id', recruiterId);
            } else {
                console.warn('webhooks - transaction.completed: No ID de suscripción ni recruiterId para asociar.');
                break; 
            }
            const { data: dbData, error: dbError } = await query;
            if (dbError) console.error('webhooks - transaction.completed: Error al actualizar BD:', dbError);
            else console.log('webhooks - transaction.completed: BD actualizada.', dbData);
        } catch (dbError) {
            console.error('webhooks - transaction.completed: Excepción al interactuar con Supabase:', dbError);
        }
        break;

      case 'subscription.created':
        console.log('webhooks - Suscripción creada. ID Paddle:', eventPaddleSubscriptionId, 'Datos:', JSON.stringify(event.data, null, 2));
        const planIdCreated = event.data.items[0]?.price?.product_id;
        const initialStatus = event.data.status || 'active'; 

        if (!recruiterId) {
            console.error('webhooks - subscription.created: Falta recruiterId. No se puede crear la suscripción en la BD.');
            break;
        }
        if (!planIdCreated) {
            console.error('webhooks - subscription.created: No se pudo obtener planIdCreated (product_id).');
            break;
        }
        try {
          const { data: dbData, error: dbError } = await supabase
            .from('suscripciones')
            .insert({
              recruiter_id: recruiterId,
              plan_id: planIdCreated,
              status: initialStatus, // Usa el status del evento de Paddle
              paddle_subscription_id: eventPaddleSubscriptionId,
            });
          if (dbError) console.error('webhooks - subscription.created: Error al insertar en BD:', dbError);
          else console.log('webhooks - subscription.created: Suscripción insertada en BD.', dbData);
        } catch (dbError) {
          console.error('webhooks - subscription.created: Excepción al interactuar con Supabase:', dbError);
        }
        break;

      case 'subscription.updated':
      case 'subscription.canceled':
      case 'subscription.paused':
      case 'subscription.resumed':
        console.log(`webhooks - Evento: ${event.eventType}. ID Paddle: ${eventPaddleSubscriptionId}. Status Paddle: ${event.data.status}. Datos:`, JSON.stringify(event.data, null, 2));
        const planIdForUpdate = event.data.items[0]?.price?.product_id; // El plan puede cambiar en un 'updated'
        const newStatusFromPaddle = event.data.status;

        if (!eventPaddleSubscriptionId) {
            console.error(`webhooks - ${event.eventType}: Falta paddle_subscription_id. No se puede actualizar.`);
            break;
        }
        
        try {
            const updatePayload = { status: newStatusFromPaddle };
            if (planIdForUpdate && (event.eventType === 'subscription.updated' || event.eventType === 'subscription.resumed')) {
                updatePayload.plan_id = planIdForUpdate;
            }
            if (event.eventType === 'subscription.resumed' && 'cvs_analizados_este_periodo' in event.data.custom_data === false) { // Solo si no viene en custom_data
                updatePayload.cvs_analizados_este_periodo = 0; 
            }

            const { data: dbData, error: dbError } = await supabase
                .from('suscripciones')
                .update(updatePayload)
                .eq('paddle_subscription_id', eventPaddleSubscriptionId); 

            if (dbError) console.error(`webhooks - ${event.eventType}: Error al actualizar BD:`, dbError);
            else console.log(`webhooks - ${event.eventType}: BD actualizada.`, dbData);
        } catch (dbError) {
            console.error(`webhooks - ${event.eventType}: Excepción al interactuar con Supabase:`, dbError);
        }
        break;

      default:
        console.log(`webhooks - Evento no manejado: ${event.eventType}, Datos: ${JSON.stringify(event.data, null, 2)}`);
    }

    res.status(200).json({ received: true });
  } catch (processingError) {
    console.error('webhooks - Error crítico al procesar el evento del webhook:', processingError.message, processingError.stack);
    res.status(500).json({ message: 'Error interno del servidor al procesar el webhook.' });
  }
}