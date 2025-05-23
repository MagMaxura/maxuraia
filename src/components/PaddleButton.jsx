import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PaddleButton = ({
  priceId,
  email,
  recruiterId,
  ctaLabel = 'Comprar ahora',
  successUrl = 'employsmartia.com/payment-success',
  cancelUrl = 'employsmartia.com'
}) => {
  const { user } = useAuth(); // Se asume que user ya está cargado si la autenticación es requerida.
  const navigate = useNavigate();

  // Función para abrir el checkout, similar al ejemplo
  const openPaddleCheckout = (items, customer, customData, settings) => {
    console.log("PaddleButton - Preparando para abrir checkout...");
    console.log("PaddleButton - Items:", items);
    console.log("PaddleButton - Customer:", customer);
    console.log("PaddleButton - Custom Data:", customData);
    console.log("PaddleButton - Settings:", settings);

    if (typeof window !== 'undefined' && window.Paddle) {
      // El ejemplo no verifica Paddle.Initialized, asume que está listo.
      // Si tu inicialización es asíncrona, considera un estado de carga.
      // Puedes añadir un console.warn si Paddle no está inicializado si lo deseas.

      try {
        window.Paddle.Checkout.open({
          items: items,
          customer: customer,
          custom_data: customData,
          settings: settings
        });
        console.log("PaddleButton - Paddle.Checkout.open llamado exitosamente.");
      } catch (error) {
        console.error("PaddleButton - Error al llamar a Paddle.Checkout.open:", error);
        // Aquí podrías agregar un mensaje de error al usuario
      }
    } else {
      console.error("PaddleButton - Paddle no está disponible en window. Asegúrate de que el script de Paddle se cargue correctamente.");
      // Aquí podrías mostrar un mensaje al usuario o un botón deshabilitado
    }
  };

  const handleClick = () => {
    console.log("PaddleButton - Clicked:", { priceId, user, successUrl, cancelUrl });

    if (!user && !email) { // Si no hay usuario autenticado ni email proporcionado
      console.warn("PaddleButton - Usuario no autenticado y sin email. Redirigiendo a /register");
      navigate('/register');
      return;
    }

    // Define items, similar al ejemplo
    const items = [
      {
        price_id: String(priceId), // Usar price_id con guion bajo
        quantity: 1
      }
    ];

    // Define customer details, similar al ejemplo
    const customer = {
      email: email || user?.email // Usar el email prop o el email del usuario
    };

    // Define custom data
    const customData = {
      recruiter_id: recruiterId || user?.id
    };

    // Define settings
    const settings = {
      success_url: successUrl,
      cancel_url: cancelUrl
    };

    // Abrir checkout usando la función similar al ejemplo
    openPaddleCheckout(items, customer, customData, settings);
  };

  return (
    <button onClick={handleClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
      {ctaLabel}
    </button>
  );
};

export default PaddleButton;

// import React from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

// const PaddleButton = ({
//   priceId,
//   email,
//   recruiterId,
//   ctaLabel = 'Comprar ahora',
//   successUrl = 'employsmartia.com/payment-success',
//   cancelUrl = 'employsmartia.com'
// }) => {
//   const { user, refreshUser } = useAuth();
//   const navigate = useNavigate();

//   const handleRefreshUser = async () => {
//     try {
//       await refreshUser();
//     } catch (error) {
//       console.error("PaddleButton - Error al refrescar el usuario:", error);
//     }
//   };

//   const handleClick = async () => {
//     console.log("PaddleButton - Clicked:", { priceId, user, successUrl, cancelUrl });
//     console.log("PaddleButton - Variables de entorno:", {
//       VITE_PADDLE_ENV: import.meta.env.VITE_PADDLE_ENV,
//       VITE_PADDLE_CLIENT_TOKEN: import.meta.env.VITE_PADDLE_CLIENT_TOKEN
//     });

//     if (!user) {
//       console.warn("PaddleButton - Usuario no autenticado. Redirigiendo a /register");
//       navigate('/register');
//       return;
//     }

//     await handleRefreshUser();

//     if (typeof window !== 'undefined' && window.Paddle) {
//       if (!window.Paddle.Initialized) {
//         console.warn("PaddleButton - Paddle no ha sido inicializado correctamente.");
//         return;
//       }

//       console.log("PaddleButton - Paddle está inicializado.");
//       console.log("PaddleButton - Entorno actual:", import.meta.env.VITE_PADDLE_ENV);
//       console.log("PaddleButton - Token de cliente:", import.meta.env.VITE_PADDLE_CLIENT_TOKEN);

//       const paddleParams = {
//         items: [{ 
//         //  priceId: String(priceId),
//           price_id: String(priceId), 
//           quantity: 1 
//         }],
//         customer: { 
//           email: email || user.email 
//         },
//         //customData: 
//         custom_data:
//         { 
//           recruiter_id: recruiterId || user.id 
//         },
//         settings: {
//           //successUrl: successUrl,
//           success_url: successUrl,
//           //cancelUrl: cancelUrl
//           cancel_url: cancelUrl
//         }
//       };

//       console.log("PaddleButton - Parámetros para Paddle.Checkout.open:", paddleParams);

//       try {
//         window.Paddle.Checkout.open(paddleParams);
//         console.log("PaddleButton - Paddle.Checkout.open llamado exitosamente.");
//       } catch (error) {
//         console.error("PaddleButton - Error al llamar a Paddle.Checkout.open:", error);
//       }
//     } else {
//       console.error("PaddleButton - Paddle no está disponible en window.");
//     }
//   };

//   return (
//     <button onClick={handleClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
//       {ctaLabel}
//     </button>
//   );
// };

// export default PaddleButton;
