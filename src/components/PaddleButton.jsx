import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PaddleButton = ({ 
  priceId, 
  email,
  recruiterId,
  ctaLabel = 'Comprar ahora', 
  successUrl = 'https://www.employsmartia.com/paymentsuccess', 
  cancelUrl = 'https://www.employsmartia.com/paymentcancelled' 
}) => {
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
      const paddleParams = {
        items: [{ 
          priceId: String(priceId), 
          quantity: 1 
        }],
        customer: { 
          email: email || user.email 
        },
        customData: { 
          recruiter_id: recruiterId || user.id 
        },
        settings: {
          successUrl: successUrl,
          cancelUrl: cancelUrl
        }
      };
      
      console.log("PaddleButton - Paddle.Checkout.open params:", paddleParams);
      window.Paddle.Checkout.open(paddleParams);
      console.log("PaddleButton - Paddle.Checkout.open called successfully");
    } else {
      console.error('Paddle no está disponible en window.');
    }
  };

  return (
    <button onClick={handleClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
      {ctaLabel}
    </button>
  );
};

export default PaddleButton;