import React from 'react';
import { getPricePreview } from '@/lib/paddleUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PaddleButton = ({ priceId, ctaLabel = 'Comprar ahora', successUrl = 'https://www.employsmartia.com/paymentsuccess', cancelUrl = 'https://www.employsmartia.com/paymentcancelled' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    console.log("PaddleButton - Clicked:", { priceId, user, successUrl, cancelUrl });
    if (!user) {
      navigate('/register');
      return;
    }

    if (!user.email_verified) {
      navigate('/register-confirmation');
      return;
    }

    if (typeof window !== 'undefined' && window.Paddle) {
      try {
        const price = await getPricePreview(priceId, 'US'); // Assuming US as default country
        console.log("PaddleButton - Price Preview:", price);

        const paddleParams = {
          items: [{ priceId: String(priceId), quantity: 1 }],
          customer: { email: user.email },
          customData: { recruiter_id: user.id },
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