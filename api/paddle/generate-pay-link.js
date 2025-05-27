// Archivo: pages/api/paddle/generate-pay-link.js (o la ruta que corresponda)

// console.log("generate-pay-link.js - Archivo ejecutado en el servidor"); // Este log es más útil al inicio de la función handler
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const PADDLE_API_KEY = process.env.PADDLE_API_KEY; // Lee la variable del servidor
const PADDLE_ENV_STRING = process.env.PADDLE_ENV || 'sandbox';
const PADDLE_SDK_ENV = PADDLE_ENV_STRING === 'production' 
                    ? Environment.production 
                    : Environment.sandbox;

let paddle; // Inicializar fuera para reutilizar si es posible, o dentro si es serverless puro.
            // Para serverless, es mejor inicializar dentro o asegurar que se maneje bien el estado.
if (PADDLE_API_KEY) {
    paddle = new Paddle(PADDLE_API_KEY, {
        environment: PADDLE_SDK_ENV,
    });
    console.log("SDK de Paddle (generate-pay-link) inicializado para el entorno:", PADDLE_SDK_ENV);
} else {
    console.error("generate-pay-link.js: PADDLE_API_KEY no está configurada. El SDK de Paddle no se puede inicializar.");
}


export default async function handler(req, res) {
  console.log("generate-pay-link.js - Nueva solicitud recibida. Método:", req.method);

  if (!paddle) {
    // Esto sucedería si PADDLE_API_KEY no estuviera definida al cargar el módulo.
    console.error("generate-pay-link.js: El SDK de Paddle no está inicializado (falta API Key).");
    return res.status(500).json({ message: 'Error de configuración del servidor: SDK de Paddle no disponible.' });
  }

  if (req.method !== 'POST') {
    console.warn("generate-pay-link.js - Método no permitido:", req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;
  console.log("generate-pay-link - Datos del cuerpo de la solicitud:", { priceId, userId, userEmail, successUrl, cancelUrl });

  if (!priceId) {
    console.warn("generate-pay-link - Falta priceId en la solicitud.");
    return res.status(400).json({ message: 'Price ID is required' });
  }

  try {
    const transactionRequest = {
      items: [{ price_id: priceId, quantity: 1 }], // price_id es correcto para el Node SDK
      custom_data: { 
        recruiter_id: userId // 'userId' del request body se mapea a 'recruiter_id'
      },
      checkout: {
        settings: {
          // Usa las URLs proporcionadas o los fallbacks (req.headers.origin podría no estar disponible en todas las configs serverless, ajusta si es necesario)
          success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || req.headers.origin || 'https://www.employsmartia.com'}/payment-success`,
          // Si usas cancelUrl, asegúrate que el dominio esté aprobado en Paddle
          // cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || req.headers.origin || 'https://www.employsmartia.com'}/payment-cancelled`,
        },
      },
    };

    if (userEmail) {
      transactionRequest.customer = { email: userEmail };
    }

    console.log("generate-pay-link - Objeto de solicitud de transacción para Paddle:", JSON.stringify(transactionRequest, null, 2));
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
    if (error.JSError && error.JSError.PaddleError) {
        console.error("generate-pay-link - Detalles del error de Paddle:", JSON.stringify(error.JSError.PaddleError, null, 2));
         return res.status(500).json({ 
            message: 'Paddle API error while generating the payment link.', 
            errorDetails: error.JSError.PaddleError.detail || error.JSError.PaddleError.type
        });
    }
    return res.status(500).json({ message: 'Internal server error while generating the payment link.' });
  }
}