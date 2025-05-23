import React from 'react';

const PaddleButton = ({ priceId, email, recruiterId, ctaLabel = 'Comprar ahora', successUrl = 'https://www.employsmartia.com/payment-success', cancelUrl = 'https://www.employsmartia.com/payment-cancelled' }) => {
  const handleClick = () => {
    console.log("PaddleButton - Clicked:", { priceId, email, recruiterId, successUrl, cancelUrl });
    if (typeof window !== 'undefined' && window.Paddle) {
      window.Paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        customer: { email: email },
        customData: { recruiter_id: recruiterId },
        settings: {
          successUrl: successUrl,
          cancelUrl: cancelUrl,
        },
      });
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