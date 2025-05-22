import { Paddle, Environment } from '@paddle/paddle-node-sdk';
// ¡IMPORTANTE! Si usas Supabase, asegurate de importar el cliente aquí
import { supabase } from '@/lib/supabase'; // Ajusta el path si lo tienes en otro lugar

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const PADDLE_ENV = process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox;

const paddle = new Paddle(PADDLE_API_KEY, {
  environment: PADDLE_ENV,
});

export const config = {
  api: {
    bodyParser: false, // Es obligatorio para webhooks firmados
  },
};

// Función auxiliar para leer el body
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
    console.warn('webhooks - Falta firma o secreto');
    return res.status(400).json({ message: 'Falta la firma del webhook o el secreto' });
  }

  let event;
  try {
    event = await paddle.webhooks.unmarshal(bodyString, PADDLE_WEBHOOK_SECRET, signature);
    console.log('webhooks - Evento de Paddle verificado:', event.eventType);
  } catch (err) {
    console.error('webhooks - Error al verificar la firma del webhook:', err.message);
    return res.status(400).json({ message: `Error de verificación de Webhook: ${err.message}` });
  }

  try {
    // IMPORTANTE: Paddle puede enviar distintos formatos de custom_data (objeto o stringificado)
    // Recomendamos usar recruiter_id como user_id (ajusta según tu integración)
    const customData = event.data.custom_data || {};
    let recruiterId =
      customData.recruiter_id ||
      customData.user_id || // fallback
      (typeof customData === 'string' ? JSON.parse(customData).recruiter_id : undefined);

    switch (event.eventType) {
      case 'transaction.completed':
        console.log('webhooks - Transacción completada:', event.data);

        // OJO: Puedes necesitar adaptar los campos según tu modelo Supabase
        const planIdTransaction = event.data.items[0].price.product_id;

        try {
          const { data: transactionData, error: transactionError } = await supabase
            .from('suscripciones')
            .update({ plan_id: planIdTransaction, status: 'active' })
            .eq('recruiter_id', recruiterId);

          if (transactionError) {
            console.error('webhooks - Error al actualizar la base de datos (transacción):', transactionError);
          } else {
            console.log('webhooks - BD actualizada correctamente (transacción):', transactionData);
          }
        } catch (error) {
          console.error('webhooks - Error al interactuar con Supabase (transacción):', error);
        }
        break;

      case 'subscription.created':
        console.log('webhooks - Suscripción creada:', event.data.id);
        const planIdCreated = event.data.items[0].price.product_id;

        try {
          const { data: createdData, error: createdError } = await supabase
            .from('suscripciones')
            .insert({
              recruiter_id: recruiterId,
              plan_id: planIdCreated,
              status: 'active',
              paddle_subscription_id: event.data.id,
            });

          if (createdError) {
            console.error('webhooks - Error al crear sub (creación):', createdError);
          } else {
            console.log('webhooks - BD creada correctamente (creación):', createdData);
          }
        } catch (error) {
          console.error('webhooks - Error al interactuar con Supabase (creación):', error);
        }
        break;

      case 'subscription.updated':
        console.log('webhooks - Suscripción actualizada:', event.data.id);
        const planIdUpdated = event.data.items[0].price.product_id;

        try {
          const { data: updatedData, error: updatedError } = await supabase
            .from('suscripciones')
            .update({ plan_id: planIdUpdated })
            .eq('recruiter_id', recruiterId);

          if (updatedError) {
            console.error('webhooks - Error al actualizar sub (actualización):', updatedError);
          } else {
            console.log('webhooks - BD actualizada correctamente (actualización):', updatedData);
          }
        } catch (error) {
          console.error('webhooks - Error al interactuar con Supabase (actualización):', error);
        }
        break;

      case 'subscription.canceled':
        console.log('webhooks - Suscripción cancelada:', event.data.id);

        try {
          const { data: canceledData, error: canceledError } = await supabase
            .from('suscripciones')
            .update({ status: 'canceled' })
            .eq('recruiter_id', recruiterId);

          if (canceledError) {
            console.error('webhooks - Error al cancelar sub:', canceledError);
          } else {
            console.log('webhooks - BD actualizada correctamente (cancelación):', canceledData);
          }
        } catch (error) {
          console.error('webhooks - Error al interactuar con Supabase (cancelación):', error);
        }
        break;

      case 'subscription.paused':
        console.log('webhooks - Suscripción pausada:', event.data.id);

        try {
          const { data: pausedData, error: pausedError } = await supabase
            .from('suscripciones')
            .update({ status: 'paused' })
            .eq('recruiter_id', recruiterId);

          if (pausedError) {
            console.error('webhooks - Error al pausar sub:', pausedError);
          } else {
            console.log('webhooks - BD actualizada correctamente (pausa):', pausedData);
          }
        } catch (error) {
          console.error('webhooks - Error al interactuar con Supabase (pausa):', error);
        }
        break;

      case 'subscription.resumed':
        console.log('webhooks - Suscripción reanudada:', event.data.id);

        try {
          const { data: resumedData, error: resumedError } = await supabase
            .from('suscripciones')
            .update({
              status: 'active',
              cvs_analizados_este_periodo: 0
            })
            .eq('recruiter_id', recruiterId);

          if (resumedError) {
            console.error('webhooks - Error al reanudar sub:', resumedError);
          } else {
            console.log('webhooks - BD actualizada correctamente (reanudar):', resumedData);
          }
        } catch (error) {
          console.error('webhooks - Error al interactuar con Supabase (reanudar):', error);
        }
        break;

      default:
        console.log(`Evento no manejado: ${event.eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error al procesar el evento del webhook:', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
