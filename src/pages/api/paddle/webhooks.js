// src/pages/api/paddle/webhooks.js
import crypto from 'crypto'; // Para la verificación de la firma (si es necesario, Paddle SDK podría manejarlo)
// import { Paddle } from '@paddle/paddle-node-sdk'; // Si usas el SDK oficial de Node.js para Paddle Billing

// Asegúrate de tener tu PADDLE_WEBHOOK_SECRET y PADDLE_PUBLIC_KEY en las variables de entorno
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET; // Para Paddle Billing, se usa un secreto de webhook
const PADDLE_PUBLIC_KEY_FOR_CLASSIC_VERIFICATION = process.env.PADDLE_PUBLIC_KEY; // Para Paddle Classic

// Inicializar el SDK de Paddle si lo estás usando (recomendado para Paddle Billing)
// const paddle = new Paddle(process.env.PADDLE_API_KEY);

export const config = {
  api: {
    bodyParser: false, // Es importante deshabilitar bodyParser para verificar la firma raw
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const rawBody = await buffer(req);
  const bodyString = rawBody.toString();
  const signature = req.headers['paddle-signature']; // Para Paddle Billing
  // const classicSignature = req.headers['paddlesignature']; // Para Paddle Classic (nombre de cabecera diferente)

  if (!signature && !PADDLE_WEBHOOK_SECRET) { // Adaptar si usas Classic
     console.warn('Firma de Webhook o secreto no encontrados. Procede sin verificación (NO RECOMENDADO PARA PRODUCCIÓN).');
  } else if (PADDLE_WEBHOOK_SECRET) {
    // --- Verificación para Paddle Billing ---
    // Documentación: https://developer.paddle.com/webhook-reference/ZG9jOjI1MzUzOTg2-verifying-webhooks
    try {
      // Si usas el SDK de Paddle, tiene una función para esto:
      // const event = paddle.webhooks.unmarshal(rawBody, PADDLE_WEBHOOK_SECRET, signature);
      // console.log('Evento de Paddle verificado (SDK):', event.type);
      // --- Implementación manual (ejemplo conceptual, el SDK es más robusto) ---
      const [timestampPart, hashPart] = signature.split(';');
      const H1Signature = hashPart.split('=')[1]; // p1_hash
      const signedPayload = `${timestampPart.split('=')[1]}.${bodyString}`; // ts_timestamp.request_body

      const expectedSignature = crypto
        .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(H1Signature), Buffer.from(expectedSignature))) {
        console.error('Firma de Webhook inválida.');
        return res.status(400).json({ message: 'Firma de Webhook inválida.' });
      }
      console.log('Firma de Webhook verificada correctamente (manual).');
      // --- Fin de implementación manual ---
    } catch (err) {
      console.error('Error al verificar la firma del webhook:', err.message);
      return res.status(400).json({ message: `Error de verificación de Webhook: ${err.message}` });
    }
  } else {
    // --- Verificación para Paddle Classic (si no usas Billing) ---
    // Esta es una implementación más compleja y propensa a errores.
    // Se recomienda el SDK o migrar a Paddle Billing para webhooks más simples.
    console.warn('Implementación de verificación para Paddle Classic no está completa. Considera usar Paddle Billing.');
  }


  let eventPayload;
  try {
    eventPayload = JSON.parse(bodyString);
  } catch (err) {
    console.error('Error al parsear el cuerpo del webhook:', err);
    return res.status(400).json({ message: 'Webhook error: Invalid JSON payload' });
  }

  console.log(`Webhook recibido - Tipo de evento: ${eventPayload.event_type || eventPayload.alert_name}`);
  console.log('Payload del Webhook:', JSON.stringify(eventPayload, null, 2));

  // Aquí procesarías el evento.
  // Por ejemplo, actualizar tu base de datos (Supabase)
  switch (eventPayload.event_type || eventPayload.alert_name) { // event_type para Billing, alert_name para Classic
    // Eventos comunes de Paddle Billing
    case 'transaction.completed':
      // Un pago se completó (puede ser único o de suscripción)
      // eventPayload.data contiene los detalles de la transacción
      console.log('Transacción completada:', eventPayload.data.id);
      // Lógica para activar servicios, actualizar estado de suscripción, etc.
      // const userId = eventPayload.data.custom_data?.user_id;
      // const items = eventPayload.data.items; // para saber qué se compró
      break;
    case 'subscription.created':
      console.log('Suscripción creada:', eventPayload.data.id);
      // const userId = eventPayload.data.custom_data?.user_id;
      // const planId = eventPayload.data.items[0]?.price.id; // ID del precio de Paddle
      // Actualizar estado del usuario a "activo" con el plan correspondiente.
      break;
    case 'subscription.updated':
      console.log('Suscripción actualizada:', eventPayload.data.id);
      // Ej: cambio de plan, pausa, etc.
      break;
    case 'subscription.canceled':
      console.log('Suscripción cancelada:', eventPayload.data.id);
      // Actualizar estado del usuario, programar desactivación de servicios al final del periodo.
      break;
    case 'subscription.paused':
        console.log('Suscripción pausada:', eventPayload.data.id);
        break;
    case 'subscription.resumed':
        console.log('Suscripción reanudada:', eventPayload.data.id);
        break;
    // Eventos comunes de Paddle Classic (alert_name)
    // case 'subscription_created':
    //   // Lógica para Paddle Classic
    //   break;
    // case 'subscription_payment_succeeded':
    //   // Lógica para Paddle Classic
    //   break;
    default:
      console.log(`Evento no manejado: ${eventPayload.event_type || eventPayload.alert_name}`);
  }

  // Responde a Paddle para confirmar la recepción
  res.status(200).json({ received: true });
}