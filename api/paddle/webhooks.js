// Archivo: [tu-ruta-api]/webhooks.js o similar

import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { supabase } from '@/lib/supabase'; // Ajusta la ruta si es necesario

// Asegúrate de que estas variables de entorno estén configuradas en tu servidor (Vercel)
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const PADDLE_ENV_STRING = process.env.PADDLE_ENV || 'sandbox'; // Lee la variable PADDLE_ENV del servidor
const PADDLE_SDK_ENV = PADDLE_ENV_STRING === 'production' ? Environment.production : Environment.sandbox;

console.log("PADDLE_API_KEY webhook disponible:", !!PADDLE_API_KEY);
console.log("PADDLE_WEBHOOK_SECRET webhook disponible:", !!PADDLE_WEBHOOK_SECRET);
console.log("PADDLE_SDK_ENV webhook:", PADDLE_SDK_ENV);

const paddle = new Paddle(PADDLE_API_KEY, {
  environment: PADDLE_SDK_ENV,
});

export const config = {
  api: {
    bodyParser: false, // Es obligatorio para webhooks firmados
  },
};

// Función auxiliar para leer el body del request
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
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
    event = await paddle.webhooks.unmarshal(bodyString, PADDLE_WEBHOOK_SECRET, signature);
    console.log(`webhooks - Evento de Paddle verificado: ${event.eventType}`);
  } catch (err) {
    console.error('webhooks - Error al verificar la firma del webhook:', err.message);
    console.error("webhooks - Request body string:", bodyString); // Loguea el body si falla la verificación
    return res.status(400).json({ message: `Error de verificación de Webhook: ${err.message}` });
  }

  try {
    const customData = event.data.custom_data || {};
    let recruiterId =
      customData.recruiter_id ||
      customData.user_id || // fallback por si se usó user_id en custom_data
      (typeof customData === 'string' ? JSON.parse(customData).recruiter_id : undefined);

    // Es crucial tener un recruiterId para la mayoría de las operaciones de BD aquí.
    // Si recruiterId es undefined en eventos de suscripción, podría indicar un problema
    // en cómo se pasó custom_data al crear la suscripción/transacción.
    if (!recruiterId && event.eventType.startsWith('subscription.')) {
        console.warn(`webhooks - No se encontró recruiterId en custom_data para el evento de suscripción ${event.eventType}, ID de suscripción de Paddle: ${event.data.id}`);
        // Decide cómo manejar esto. ¿Debería fallar? ¿O se puede obtener de otra forma?
    }
    
    const paddleSubscriptionId = event.data.id; // Para eventos de suscripción
    const transactionPaddleSubscriptionId = event.data.subscription_id; // Para transaction.completed asociado a una suscripción

    switch (event.eventType) {
      case 'transaction.completed':
        console.log('webhooks - Transacción completada. Datos:', JSON.stringify(event.data, null, 2));
        const planIdTransaction = event.data.items[0]?.price?.product_id;

        if (!planIdTransaction) {
            console.error('webhooks - transaction.completed: No se pudo obtener planIdTransaction (product_id).');
            break; // Salir del case si no hay product_id
        }

        // Lógica para transaction.completed:
        // Este evento puede ser para un pago único o para un pago de una suscripción.
        // Si está asociado a una suscripción (transactionPaddleSubscriptionId existe),
        // a menudo solo necesitas registrar el pago o actualizar fechas de ciclo.
        // La activación de la suscripción suele manejarse mejor con eventos 'subscription.created' o 'subscription.updated'.
        // La lógica actual actualiza el plan y el estado a 'active'.
        // Considera si esto es lo que quieres para CADA transacción completada.

        try {
            let query = supabase.from('suscripciones');
            const updatePayload = { 
                plan_id: planIdTransaction, 
                status: 'active' // Considera si siempre debe ser 'active' aquí.
                                 // Podría ser más seguro usar event.data.status de un evento de suscripción.
            };

            if (transactionPaddleSubscriptionId) {
                console.log(`webhooks - transaction.completed para suscripción ID: ${transactionPaddleSubscriptionId}`);
                query = query.update(updatePayload).eq('paddle_subscription_id', transactionPaddleSubscriptionId);
            } else if (recruiterId) {
                // Para compras únicas o si no hay ID de suscripción, usa recruiterId.
                // Esto asume que ya existe un registro para este recruiterId.
                console.log(`webhooks - transaction.completed (no-suscripción/pago único) para recruiterId: ${recruiterId}`);
                query = query.update(updatePayload).eq('recruiter_id', recruiterId);
            } else {
                console.warn('webhooks - transaction.completed: No paddleSubscriptionId ni recruiterId para asociar la transacción.');
                break; // No se puede actuar si no hay identificador
            }

            const { data: transactionDbData, error: transactionDbError } = await query;

            if (transactionDbError) {
                console.error('webhooks - transaction.completed: Error al actualizar BD:', transactionDbError);
            } else {
                console.log('webhooks - transaction.completed: BD actualizada.', transactionDbData);
            }
        } catch (dbError) {
            console.error('webhooks - transaction.completed: Excepción al interactuar con Supabase:', dbError);
        }
        break;

      case 'subscription.created':
        console.log('webhooks - Suscripción creada. ID:', paddleSubscriptionId, 'Datos:', JSON.stringify(event.data, null, 2));
        const planIdCreated = event.data.items[0]?.price?.product_id;
        const initialStatus = event.data.status || 'active'; // Usa el status de Paddle, o 'active' como fallback

        if (!recruiterId) {
            console.error('webhooks - subscription.created: Falta recruiterId. No se puede crear la suscripción en la BD.');
            break;
        }
        if (!planIdCreated) {
            console.error('webhooks - subscription.created: No se pudo obtener planIdCreated (product_id).');
            break;
        }

        try {
          const { data: createdDbData, error: createdDbError } = await supabase
            .from('suscripciones')
            .insert({
              recruiter_id: recruiterId,
              plan_id: planIdCreated,
              status: initialStatus, // Usar el status del evento
              paddle_subscription_id: paddleSubscriptionId, // Guardar el ID de suscripción de Paddle
            });

          if (createdDbError) {
            console.error('webhooks - subscription.created: Error al insertar en BD:', createdDbError);
          } else {
            console.log('webhooks - subscription.created: Suscripción insertada en BD.', createdDbData);
          }
        } catch (dbError) {
          console.error('webhooks - subscription.created: Excepción al interactuar con Supabase:', dbError);
        }
        break;

      // Para los siguientes eventos, usamos paddleSubscriptionId para encontrar el registro
      // y event.data.status para actualizar el estado.
      case 'subscription.updated':
      case 'subscription.canceled':
      case 'subscription.paused':
      case 'subscription.resumed':
        console.log(`webhooks - Evento: ${event.eventType}. ID: ${paddleSubscriptionId}. Status de Paddle: ${event.data.status}. Datos:`, JSON.stringify(event.data, null, 2));
        const planIdForUpdate = event.data.items[0]?.price?.product_id;
        const newStatus = event.data.status;

        if (!paddleSubscriptionId) {
            console.error(`webhooks - ${event.eventType}: Falta paddle_subscription_id. No se puede actualizar.`);
            break;
        }
        if (!planIdForUpdate && (event.eventType === 'subscription.updated' || event.eventType === 'subscription.resumed')) {
             console.error(`webhooks - ${event.eventType}: No se pudo obtener planIdForUpdate (product_id).`);
            // Decide si romper o continuar solo actualizando el status
        }

        try {
            const updatePayload = { status: newStatus };
            if (planIdForUpdate && (event.eventType === 'subscription.updated' || event.eventType === 'subscription.resumed')) {
                updatePayload.plan_id = planIdForUpdate;
            }
            if (event.eventType === 'subscription.resumed') {
                updatePayload.cvs_analizados_este_periodo = 0; // Lógica específica para reanudar
            }

            const { data: updatedDbData, error: updatedDbError } = await supabase
                .from('suscripciones')
                .update(updatePayload)
                .eq('paddle_subscription_id', paddleSubscriptionId); // Usar paddle_subscription_id

            if (updatedDbError) {
                console.error(`webhooks - ${event.eventType}: Error al actualizar BD:`, updatedDbError);
            } else {
                console.log(`webhooks - ${event.eventType}: BD actualizada.`, updatedDbData);
            }
        } catch (dbError) {
            console.error(`webhooks - ${event.eventType}: Excepción al interactuar con Supabase:`, dbError);
        }
        break;

      default:
        console.log(`webhooks - Evento no manejado: ${event.eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (processingError) {
    console.error('webhooks - Error al procesar el evento del webhook:', processingError.message);
    // No re-loguear 'event' aquí si ya falló unmarshal, ya que podría no estar definido o ser el rawBody.
    // console.error("webhooks - Event data (en error de procesamiento):", event); // 'event' podría no ser el objeto parseado
    res.status(500).json({ message: 'Error interno del servidor al procesar el webhook.' });
  }
}