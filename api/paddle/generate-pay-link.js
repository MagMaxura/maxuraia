console.log("generate-pay-link.js - Archivo ejecutado");
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

// Asegúrate de que PADDLE_API_KEY esté correctamente configurada en tus variables de entorno del servidor
const PADDLE_API_KEY = process.env['PADDLE_API_KEY'];
const PADDLE_ENV = process.env['PADDLE_ENV'] === 'production' 
                    ? Environment.production 
                    : Environment.sandbox; // Es mejor leer esto también de una variable de entorno

console.log("PADDLE_API_KEY disponible:", !!PADDLE_API_KEY); // Verifica si la API key se cargó
console.log("PADDLE_ENV:", PADDLE_ENV);

const paddle = new Paddle(PADDLE_API_KEY, {
  environment: PADDLE_ENV,
});

export default async function handler(req, res) {
  console.log("generate-pay-link.js - Nueva solicitud recibida. Método:", req.method);

  if (req.method !== 'POST') {
    console.warn("generate-pay-link.js - Método no permitido:", req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Desestructura los datos esperados. userId podría ser tu recruiterId.
  const { priceId, userId, userEmail, successUrl /*, cancelUrl */ } = req.body;
  console.log("generate-pay-link - Datos del cuerpo de la solicitud:", { priceId, userId, userEmail, successUrl /*, cancelUrl */ });

  if (!priceId) {
    console.warn("generate-pay-link - Falta priceId en la solicitud.");
    return res.status(400).json({ message: 'Price ID is required' });
  }

  try {
    const transactionRequest = {
      items: [{ price_id: priceId, quantity: 1 }], // CORREGIDO: price_id
      // Opcional: añade custom_data si lo necesitas para tus webhooks o seguimiento
      custom_data: { 
        recruiter_id: userId // Asumiendo que userId es el recruiterId
      },
      checkout: {
        settings: {
          success_url: successUrl || `${req.headers.origin}/payment-success`,
          // Descomenta y ajusta cancel_url si es necesario
          // cancel_url: cancelUrl || `${req.headers.origin}/payment-cancelled`,
        },
      },
    };

    if (userEmail) {
      transactionRequest.customer = { email: userEmail };
    }

    console.log("generate-pay-link - Objeto de solicitud de transacción para Paddle:", transactionRequest);
    const transaction = await paddle.transactions.create(transactionRequest);
    console.log("generate-pay-link - Respuesta de creación de transacción de Paddle:", transaction);

    const checkoutUrl = transaction.checkout?.url;
    if (!checkoutUrl) {
      console.error('generate-pay-link - No se pudo obtener checkout.url de la respuesta de Paddle.');
      return res.status(500).json({ message: 'Failed to generate checkout URL from Paddle response.' });
    }

    return res.status(200).json({ checkoutUrl, transactionId: transaction.id });
  } catch (error) {
    console.error("generate-pay-link - Error al crear la transacción con Paddle:", error.message);
    // Si es un error de la API de Paddle, tendrá más detalles
    if (error.JSError && error.JSError.PaddleError) {
        console.error("generate-pay-link - Detalles del error de Paddle:", error.JSError.PaddleError);
         return res.status(500).json({ 
            message: 'Paddle API error while generating the payment link.', 
            errorDetails: error.JSError.PaddleError.detail || error.JSError.PaddleError.type
        });
    }
    return res.status(500).json({ message: 'Internal server error while generating the payment link.' });
  }
}