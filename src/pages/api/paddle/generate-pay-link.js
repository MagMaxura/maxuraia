// src/pages/api/paddle/generate-pay-link.js
import { APP_PLANS, getPlanById } from '../../../config/plans'; // Ajusta la ruta si es necesario

// Esta es la URL base para la API de Paddle Billing.
// Para Paddle Classic, sería diferente (ej. https://vendors.paddle.com/api/2.0/product/generate_pay_link)
const PADDLE_API_BASE_URL = 'https://api.paddle.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

  if (!priceId) {
    return res.status(400).json({ message: 'Price ID is required' });
  }

  // Opcional: Validar que el priceId corresponde a un plan conocido
  // const plan = Object.values(APP_PLANS).find(p => p.paddlePriceId === priceId);
  // if (!plan) {
  //   return res.status(400).json({ message: 'Invalid Price ID' });
  // }

  const PADDLE_API_KEY = process.env.PADDLE_API_KEY;

  if (!PADDLE_API_KEY) {
    console.error('Paddle API Key no está configurada en las variables de entorno.');
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }

  try {
    // Para Paddle Billing, se crea una transacción (checkout)
    // Documentación: https://developer.paddle.com/api-reference/ZG9jOjI1MzUzOTg4-create-a-transaction
    const paddleRequestBody = {
      items: [{ price_id: priceId, quantity: 1 }],
      // customer_id: 'passthrough_customer_id', // Si ya tienes un customer_id en Paddle
      // address_id: 'passthrough_address_id', // Si ya tienes un address_id en Paddle
      // business_id: 'passthrough_business_id', // Si ya tienes un business_id en Paddle
      custom_data: { // Datos que quieres que Paddle te devuelva en webhooks
        user_id: userId,
        // app_plan_id: plan.id, // Si validaste el plan arriba
      },
      // Opciones de UI del Checkout
      // checkout: {
      //   settings: {
      //     success_url: successUrl || `${req.headers.origin}/payment-success`,
      //     cancel_url: cancelUrl || `${req.headers.origin}/payment-cancelled`, // Página a la que volver si cancela
      //     // theme: 'light', // o 'dark'
      //     // locale: 'es', // Para forzar el idioma del checkout
      //   }
      // }
    };

    // Si se proporciona userEmail, se puede usar para pre-rellenar el checkout
    if (userEmail) {
      paddleRequestBody.customer = { email: userEmail };
    }
    
    // NOTA: La API de Paddle para crear un checkout (transacción) es un poco diferente
    // a la de "generate_pay_link" de la API clásica.
    // En Paddle Billing, normalmente se obtiene un `transaction_id` y luego se usa Paddle.js
    // con ese ID o se redirige a una URL de checkout que Paddle proporciona.
    // Por ahora, simularemos la respuesta esperada para abrir con Paddle.js

    // ***** SIMULACIÓN DE LLAMADA A PADDLE API *****
    // En un caso real, aquí harías la llamada fetch a la API de Paddle:
    // const response = await fetch(`${PADDLE_API_BASE_URL}/transactions`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${PADDLE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(paddleRequestBody),
    // });
    // const paddleData = await response.json();
    // if (!response.ok || paddleData.error) {
    //   console.error('Error de Paddle API:', paddleData.error);
    //   return res.status(500).json({ message: paddleData.error?.detail || 'Error al generar el enlace de pago.' });
    // }
    // const checkoutUrl = paddleData.data.checkout_url; // O el ID de la transacción para Paddle.js
    // return res.status(200).json({ checkoutUrl: checkoutUrl, transactionId: paddleData.data.id });
    // ***********************************************


    // Por ahora, devolvemos un objeto que simula lo que Paddle.js podría necesitar
    // o una URL de checkout genérica si no se usa Paddle.js directamente para abrirlo.
    // Para usar con Paddle.Checkout.open({ transactionId: 'txn_xxx' })
    // O si Paddle devuelve una URL directa: Paddle.Checkout.open({ override: 'url_del_checkout' })

    // Este es un placeholder. La respuesta real dependerá de la API de Paddle que uses (Billing vs Classic)
    // y cómo quieras integrar el checkout (overlay, inline, redirect).
    // Para Paddle Billing, usualmente se obtiene un `id` de transacción.
    const simulatedPaddleResponse = {
      transactionId: `txn_simulated_${Date.now()}`, // ID de transacción simulado
      checkoutUrl: `https://checkout.paddle.com/simulated-checkout?txn_id=txn_simulated_${Date.now()}&price_id=${priceId}`, // URL simulada
      message: "Esto es una respuesta simulada. Debes implementar la llamada real a la API de Paddle."
    };

    console.log("Cuerpo de la solicitud a Paddle (simulado):", JSON.stringify(paddleRequestBody, null, 2));
    console.log("Respuesta simulada de Paddle:", JSON.stringify(simulatedPaddleResponse, null, 2));

    // Devolver el ID de la transacción para que Paddle.js lo use, o la URL del checkout
    return res.status(200).json(simulatedPaddleResponse);

  } catch (error) {
    console.error('Error interno del servidor:', error);
    return res.status(500).json({ message: 'Error interno del servidor al generar el enlace de pago.' });
  }
}