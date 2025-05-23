import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Inicialización de Paddle.js
if (typeof window !== 'undefined' && window.Paddle) {
  const paddleClientToken = import.meta.env.PADDLE_CLIENT_TOKEN;
  const paddleEnvironment = import.meta.env.PADDLE_ENV || 'sandbox'; // 'sandbox' o 'live'

  if (import.meta.env.PADDLE_CLIENT_TOKEN) {
    window.Paddle.Initialize({
      token: import.meta.env.PADDLE_CLIENT_TOKEN,
      environment: paddleEnvironment,
      eventCallback: function(data) {
        // Opcional: manejar eventos de Paddle directamente en el frontend si es necesario
        console.log("Paddle Event:", data);
        if (data.name === "checkout.loaded") {
          console.log("Paddle Checkout cargado.");
        }
        if (data.name === "checkout.closed") {
          console.log("Paddle Checkout cerrado. Motivo:", data.data?.reason);
          // Aquí podrías querer actualizar el estado de la UI, por ejemplo, si el usuario cerró el popup.
        }
        // Puedes añadir más manejadores de eventos según necesites
      }
    });
    console.log(`Paddle.js inicializado en modo ${paddleEnvironment}.`);
  } else {
    console.error("VITE_PADDLE_CLIENT_TOKEN no está configurado. Paddle.js no se inicializará.");
    // Podrías mostrar una notificación al usuario o deshabilitar funciones de pago.
  }
} else {
  // Esto podría ocurrir si el script de Paddle no se cargó a tiempo o fue bloqueado.
  console.error("Paddle.js no encontrado en window. Paddle no funcionará.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
