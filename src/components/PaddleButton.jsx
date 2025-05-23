import React from 'react';

const PaddleButton = ({ priceId, email, recruiterId, ctaLabel = 'Comprar ahora', successUrl = 'https://www.employsmartia.com/paymentsuccess', cancelUrl = 'https://www.employsmartia.com/paymentcancelled' }) => {
  const handleClick = () => {
    console.log("PaddleButton - Clicked:", { priceId, email, recruiterId, successUrl, cancelUrl });
    if (typeof window !== 'undefined' && window.Paddle) {
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