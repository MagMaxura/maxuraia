import React from 'react';
import { getPricePreview } from '@/lib/paddleUtils';

const PaddleButton = ({ priceId, email, recruiterId, ctaLabel = 'Comprar ahora', successUrl = 'https://www.employsmartia.com/paymentsuccess', cancelUrl = 'https://www.employsmartia.com/paymentcancelled' }) => {
  const handleClick = async () => {
    console.log("PaddleButton - Clicked:", { priceId, email, recruiterId, successUrl, cancelUrl });
    if (typeof window !== 'undefined' && window.Paddle) {
      try {
        const price = await getPricePreview(priceId, 'US'); // Assuming US as default country
        console.log("PaddleButton - Price Preview:", price);

        const paddleParams = {
          items: [{ priceId: String(priceId), quantity: 1 }],
          customer: { email: email },
          customData: { recruiter_id: recruiterId },
          settings: {
            successUrl: successUrl,
            cancelUrl: cancelUrl,
          },
        };
        console.log("PaddleButton - Paddle.Checkout.open params:", paddleParams);
        window.Paddle.Checkout.open(paddleParams);
      } catch (error) {
        console.error("PaddleButton - Error fetching price preview:", error);
      }
    } else {
      console.error('Paddle no está disponible en window.');
    }
  };

  return (
    <button onClick={handleClick}>
      {ctaLabel}
    </button>
  );
};

export default PaddleButton;