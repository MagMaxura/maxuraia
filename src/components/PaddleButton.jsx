import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PaddleButton = ({
  priceId,
  email,
  recruiterId,
  ctaLabel = 'Comprar ahora',
  // Asegúrate que estas URLs sean completas y correctas
  successUrl = 'https://www.employsmartia.com/payment-success', // URL completa para éxito
  // Si vuelves a habilitar cancelUrl, asegúrate que sea una URL completa y válida
  // y que tu dominio esté aprobado en Paddle para ella.
  // cancelUrl = 'https://www.employsmartia.com/payment-cancelled'
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const openPaddleCheckout = (items, customer, customData, settings) => {
    console.log("PaddleButton - Preparando para abrir checkout...");
    console.log("PaddleButton - Items:", items);
    console.log("PaddleButton - Customer:", customer);
    console.log("PaddleButton - Custom Data:", customData);
    console.log("PaddleButton - Settings:", settings);

    if (typeof window !== 'undefined' && window.Paddle) {
      try {
        window.Paddle.Checkout.open({
          items: items,
          customer: customer,
          custom_data: customData, // Clave correcta para Paddle.js
          settings: settings
        });
        console.log("PaddleButton - Paddle.Checkout.open llamado exitosamente.");
      } catch (error) {
        console.error("PaddleButton - Error al llamar a Paddle.Checkout.open:", error);
      }
    } else {
      console.error("PaddleButton - Paddle no está disponible...");
    }
  };

  const handleClick = () => {
    console.log("PaddleButton - Clicked:", { priceId, user, successUrl /*, cancelUrl */ });

    if (!user && !email) {
      console.warn("PaddleButton - Usuario no autenticado y sin email. Redirigiendo a /register");
      navigate('/register');
      return;
    }

    const items = [
      {
        price_id: String(priceId), // << CORREGIDO: usa price_id (snake_case)
        quantity: 1
      }
    ];

    const customer = {
      email: email || user?.email
    };

    const customData = { // Este se pasará como custom_data a Paddle.Checkout.open
      recruiter_id: recruiterId || user?.id
    };

    // Objeto settings CORRECTO y PLANO
    const settings = {
      success_url: successUrl,
      display_mode: 'overlay'
      // Si resuelves el problema de validación de cancel_url, puedes añadirlo aquí:
      // cancel_url: cancelUrl,
      // Puedes añadir otras opciones válidas como 'theme' o 'locale' si las necesitas
      // NO incluyas el objeto anidado 'settings' con 'apiKey' o 'currency' aquí.
    };

    openPaddleCheckout(items, customer, customData, settings);
  };

  return (
    <button onClick={handleClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
      {ctaLabel}
    </button>
  );
};

export default PaddleButton;