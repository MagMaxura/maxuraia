// src/pages/api/paddle/webhooks.js

import { Paddle, Environment } from '@paddle/paddle-node-sdk';

// Configuración del entorno
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const PADDLE_ENV = process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox;

// Inicializar el SDK de Paddle
const paddle = new Paddle(PADDLE_API_KEY, {
  environment: PADDLE_ENV,
});

export const config = {
  api: {
    bodyParser: false, // Deshabilitar bodyParser para acceder al cuerpo sin procesar
  },
};

// Función para obtener el cuerpo sin procesar de la solicitud
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
    console.warn('Firma de Webhook o secreto no encontrados. Procede sin verificación (NO RECOMENDADO PARA PRODUCCIÓN).');
    return res.status(400).json({ message: 'Falta la firma del webhook o el secreto' });
  }

  let event;
  try {
    // Verificar la firma del webhook
    event = await paddle.webhooks.unmarshal(bodyString, PADDLE_WEBHOOK_SECRET, signature);
    console.log('Evento de Paddle verificado:', event.eventType);
  } catch (err) {
    console.error('Error al verificar la firma del webhook:', err.message);
    return res.status(400).json({ message: `Error de verificación de Webhook: ${err.message}` });
  }

  // Procesar el evento según su tipo
  try {
    switch (event.eventType) {
      case 'transaction.completed':
        console.log('Transacción completada:', event.data.id);
        // Lógica para activar servicios, actualizar estado de suscripción, etc.
        // Obtener el ID del reclutador y el ID del plan de los datos del evento
        const recruiterIdTransaction = event.data.custom_data.recruiter_id;
        const planIdTransaction = event.data.items[0].price.product_id;

        // Actualizar la base de datos de Supabase para reflejar la nueva transacción
        try {
          const { data: transactionData, error: transactionError } = await supabase
            .from('suscripciones')
            .update({
              plan_id: planIdTransaction,
            })
            .eq('recruiter_id', recruiterIdTransaction);

          if (transactionError) {
            console.error('Error al actualizar la base de datos de Supabase (transacción):', transactionError, { event });
          } else {
            console.log('Base de datos de Supabase actualizada correctamente (transacción):', transactionData, { event });
          }
        } catch (error) {
          console.error('Error al interactuar con Supabase (transacción):', error, { event });
        }
        break;
      case 'subscription.created':
        console.log('Suscripción creada:', event.data.id);
        // Lógica para manejar la creación de una nueva suscripción
        // Obtener el ID del reclutador y el ID del plan de los datos del evento
        const recruiterIdCreated = event.data.custom_data.recruiter_id;
        const planIdCreated = event.data.items[0].price.product_id;

        // Actualizar la base de datos de Supabase para reflejar la nueva suscripción
        try {
          const { data: createdData, error: createdError } = await supabase
            .from('suscripciones')
            .insert({
              recruiter_id: recruiterIdCreated,
              plan_id: planIdCreated,
              status: 'active',
              paddle_subscription_id: event.data.id,
            })
            .select();

          if (createdError) {
            console.error('Error al actualizar la base de datos de Supabase (creación):', createdError, { event });
          } else {
            console.log('Base de datos de Supabase actualizada correctamente (creación):', createdData, { event });
          }
        } catch (error) {
          console.error('Error al interactuar con Supabase (creación):', error, { event });
        }
        break;
      case 'subscription.updated':
        console.log('Suscripción actualizada:', event.data.id);
        // Lógica para manejar la actualización de una suscripción existente
        // Obtener el ID del reclutador y el ID del plan de los datos del evento
        const recruiterIdUpdated = event.data.custom_data.recruiter_id;
        const planIdUpdated = event.data.items[0].price.product_id;

        // Actualizar la base de datos de Supabase para reflejar la actualización de la suscripción
        try {
          const { data: updatedData, error: updatedError } = await supabase
            .from('suscripciones')
            .update({
              plan_id: planIdUpdated,
            })
            .eq('recruiter_id', recruiterIdUpdated);

          if (updatedError) {
            console.error('Error al actualizar la base de datos de Supabase (actualización):', updatedError, { event });
          } else {
            console.log('Base de datos de Supabase actualizada correctamente (actualización):', updatedData, { event });
          }
        } catch (error) {
          console.error('Error al interactuar con Supabase (actualización):', error, { event });
        }
        break;
      case 'subscription.canceled':
        console.log('Suscripción cancelada:', event.data.id);
        // Lógica para manejar la cancelación de una suscripción
        // Obtener el ID del reclutador de los datos del evento
        const recruiterIdCanceled = event.data.custom_data.recruiter_id;

        // Actualizar la base de datos de Supabase para reflejar la cancelación de la suscripción
        try {
          const { data: canceledData, error: canceledError } = await supabase
            .from('suscripciones')
            .update({
              status: 'canceled',
            })
            .eq('recruiter_id', recruiterIdCanceled);

          if (canceledError) {
            console.error('Error al actualizar la base de datos de Supabase (cancelación):', canceledError, { event });
          } else {
            console.log('Base de datos de Supabase actualizada correctamente (cancelación):', canceledData, { event });
          }
        } catch (error) {
          console.error('Error al interactuar con Supabase (cancelación):', error, { event });
        }
        break;
      case 'subscription.paused':
        console.log('Suscripción pausada:', event.data.id);
        // Lógica para manejar la pausa de una suscripción
        // Obtener el ID del reclutador de los datos del evento
        const recruiterIdPaused = event.data.custom_data.recruiter_id;

        // Actualizar la base de datos de Supabase para reflejar la pausa de la suscripción
        try {
          const { data: pausedData, error: pausedError } = await supabase
            .from('suscripciones')
            .update({
              status: 'paused',
            })
            .eq('recruiter_id', recruiterIdPaused);

          if (pausedError) {
            console.error('Error al actualizar la base de datos de Supabase (pausa):', pausedError, { event });
          } else {
            console.log('Base de datos de Supabase actualizada correctamente (pausa):', pausedData, { event });
          }
        } catch (error) {
          console.error('Error al interactuar con Supabase (pausa):', error, { event });
        }
        break;
      case 'subscription.resumed':
        console.log('Suscripción reanudada:', event.data.id);
        // Lógica para manejar la reanudación de una suscripción
        // Obtener el ID del reclutador de los datos del evento
        const recruiterIdResumed = event.data.custom_data.recruiter_id;

        // Actualizar la base de datos de Supabase para reflejar la reanudación de la suscripción
        try {
          const { data: resumedData, error: resumedError } = await supabase
            .from('suscripciones')
            .update({
              status: 'active',
              cvs_analizados_este_periodo: 0, // Reiniciar el contador al renovar
            })
            .eq('recruiter_id', recruiterIdResumed);
    
          if (resumedError) {
            console.error('Error al actualizar la base de datos de Supabase (reanudación):', resumedError, { event });
          } else {
            console.log('Base de datos de Supabase actualizada correctamente (reanudación):', resumedData, { event });
          }
        } catch (error) {
          console.error('Error al interactuar con Supabase (reanudación):', error, { event });
        }
        break;
      default:
        console.log(`Evento no manejado: ${event.eventType}`);
    }

    // Responder a Paddle para confirmar la recepción
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error al procesar el evento del webhook:', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
