console.log("generate-pay-link.js - Archivo ejecutado");
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const PADDLE_API_KEY = process.env['PADDLE_API_KEY'];
console.log("VITE_PADDLE_API:", process.env['VITE_PADDLE_API']);
const PADDLE_ENV = Environment.sandbox;

console.log("PADDLE_API_KEY:", PADDLE_API_KEY);
const paddle = new Paddle(PADDLE_API_KEY, {
  environment: PADDLE_ENV,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log("Estamos por mandar un POST");
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;
  console.log("generate-pay-link - Request received:", { priceId, userId, userEmail, successUrl, cancelUrl });

  if (!priceId) {
    return res.status(400).json({ message: 'Price ID is required' });
  }

  try {
    const transactionRequest = {
      items: [{ priceId: priceId, quantity: 1 }],
      checkout: {
        settings: {
          success_url: successUrl || `${req.headers.origin}/payment-success`,
          //cancel_url: cancelUrl || `${req.headers.origin}/payment-cancelled`,
        },
      },
    };

    if (userEmail) {
      transactionRequest.customer = { email: userEmail };
    }

    console.log("Transaction Request:", transactionRequest);
    const transaction = await paddle.transactions.create(transactionRequest);
    console.log("Transaction Response:", transaction);

    const checkoutUrl = transaction.checkout?.url;
    if (!checkoutUrl) {
      return res.status(500).json({ message: 'Failed to generate checkout URL.' });
    }

    return res.status(200).json({ checkoutUrl, transactionId: transaction.id });
  } catch (error) {
    console.error("generate-pay-link - Error:", error);
    return res.status(500).json({ message: 'Internal server error while generating the payment link.', error: true });
  }
}
