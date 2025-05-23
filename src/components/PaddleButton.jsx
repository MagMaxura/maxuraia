import React from 'react';
import { getPricePreview } from '@/lib/paddleUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PaddleButton = ({ priceId, ctaLabel = 'Comprar ahora', successUrl = 'https://www.employsmartia.com/paymentsuccess', cancelUrl = 'https://www.employsmartia.com/paymentcancelled' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    console.log("PaddleButton - Clicked:", { priceId, user, successUrl, cancelUrl });
      
        var paddleParams = {
          items: [{ priceId: String(priceId), quantity: 1 }],
 //         customer: { email: user.email },
 //         customData: { recruiter_id: user.id },
 //         settings: {
 //           successUrl: successUrl,
 //           cancelUrl: cancelUrl,
          },
        };

        console.log("PaddleButton - Paddle.Checkout.open params:", paddleParams);
        window.Paddle.Checkout.open({
          setting:{    
            displayMode: "overlay",
            theme: "light",
            locale: "en"}
        },
          paddleParams);
        console.log("PaddleButton - Paddle.Checkout.open called successfully");
  };

  return (
    <button onClick={handleClick}>
      {ctaLabel}
    </button>
  );
  console.log("PaddleButton - Paddle.Checkout.open called successfully");
};

export default PaddleButton;