import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PaddleButton = ({
  priceId,
  email,
  recruiterId,
  ctaLabel = 'Comprar ahora',
  successUrl = 'https://www.employsmartia.com/payment-success',
  cancelUrl = 'https://www.employsmartia.com/payment-cancelled'
}) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleRefreshUser = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error("PaddleButton - Error al refrescar el usuario:", error);
    }
  };

  const handleClick = async () => {
    console.log("PaddleButton - Clicked:", { priceId, user, successUrl, cancelUrl });
    console.log("PaddleButton - Variables de entorno:", {
      VITE_PADDLE_ENV: import.meta.env.VITE_PADDLE_ENV,
      VITE_PADDLE_CLIENT_TOKEN: import.meta.env.VITE_PADDLE_CLIENT_TOKEN
    });

    if (!user) {
      console.warn("PaddleButton - Usuario no autenticado. Redirigiendo a /register");
      navigate('/register');
      return;
    }

    await handleRefreshUser();

    if (typeof window !== 'undefined' && window.Paddle) {
      if (!window.Paddle.Initialized) {
        console.warn("PaddleButton - Paddle no ha sido inicializado correctamente.");
        return;
      }

      console.log("PaddleButton - Paddle está inicializado.");
      console.log("PaddleButton - Entorno actual:", import.meta.env.VITE_PADDLE_ENV);
      console.log("PaddleButton - Token de cliente:", import.meta.env.VITE_PADDLE_CLIENT_TOKEN);

      const paddleParams = {
        items: [{ 
        //  priceId: String(priceId),
          price_id: String(priceId), 
          quantity: 1 
        }],
        customer: { 
          email: email || user.email 
        },
        //customData: 
        custom_data:
        { 
          recruiter_id: recruiterId || user.id 
        },
        settings: {
          //successUrl: successUrl,
          success_url: successUrl,
          //cancelUrl: cancelUrl
          cancel_url: cancelUrl
        }
      };

      console.log("PaddleButton - Parámetros para Paddle.Checkout.open:", paddleParams);

      try {
        window.Paddle.Checkout.open(paddleParams);
        console.log("PaddleButton - Paddle.Checkout.open llamado exitosamente.");
      } catch (error) {
        console.error("PaddleButton - Error al llamar a Paddle.Checkout.open:", error);
      }
    } else {
      console.error("PaddleButton - Paddle no está disponible en window.");
    }
  };

  return (
    <button onClick={handleClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
      {ctaLabel}
    </button>
  );
};

export default PaddleButton;
