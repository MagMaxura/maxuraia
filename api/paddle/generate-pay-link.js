// src/pages/api/paddle/generate-pay-link.js

import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_ENV = process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox;

const paddle = new Paddle(PADDLE_API_KEY, {
  environment: PADDLE_ENV,
});
console.log('generate-pay-link - PADDLE_API_KEY:', PADDLE_API_KEY);
export default async function handler(req, res) {
  console.log('generate-pay-link - handler called', {req});
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    console.log('generate-pay-link - Method Not Allowed');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;
  console.log('generate-pay-link - req.body:', req.body);
  console.log('generate-pay-link - priceId from req.body:', priceId);
  if (!priceId) {
    console.log('generate-pay-link - Price ID is required');
    return res.status(400).json({ message: 'Price ID is required' });
  }

  try {
    const transactionRequest = {
      items: [{ price_id: priceId, quantity: 1 }],
      custom_data: { user_id: userId },
      checkout: {
        settings: {
          success_url: successUrl || `${req.headers.origin}/payment-success`,
          cancel_url: cancelUrl || `${req.headers.origin}/payment-cancelled`,
        },
      },
    };

    if (userEmail) {
      transactionRequest.customer = { email: userEmail };
    }
const transaction = await paddle.transactions.create(transactionRequest);
console.log('generate-pay-link - transaction:', transaction);

const transactionId = transaction.id;
const checkoutUrl = transaction.checkout?.url;

if (!checkoutUrl) {
  console.error('No checkout URL returned by Paddle.');
  console.log('generate-pay-link - No checkout URL returned by Paddle.');
  return res.status(500).json({ message: 'Failed to generate checkout URL.' });
}


    return res.status(200).json({ transactionId, checkoutUrl });
  } catch (error) {
    console.error('Error creating transaction:', error);

    if (error instanceof Paddle.PaddleError) {
      // Handle Paddle API errors
      console.error('Paddle API error:', error.message);
      return res.status(500).json({ message: `Paddle API error: ${error.message}`, error: true });
    } else if (error instanceof ValidationError) {
      // Handle validation errors
      console.error('Validation error:', error.message);
      return res.status(400).json({ message: `Validation error: ${error.message}`, error: true });
    } else {
      // Handle other errors
      console.error('Internal server error:', error);
      return res.status(500).json({ message: 'Internal server error while generating the payment link.', error: true });
    }
  }
}