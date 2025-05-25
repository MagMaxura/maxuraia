import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

if (typeof window !== 'undefined' && window.Paddle) {
  const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  const paddleEnvironment = import.meta.env.VITE_PADDLE_ENV || 'sandbox';
  const paddleVendor = import.meta.env.VITE_PADDLE_VENDOR_ID;

  if (paddleClientToken) {
    if (paddleEnvironment === 'sandbox') {
      window.Paddle.Environment.set('sandbox');
    }

    window.Paddle.Initialize({
      token: paddleClientToken,
      eventCallback: function(event) { // <--- MEJORA ESTE LOGGING
        console.log('--- Paddle Event Received ---');
        console.log(event);
        console.log('Event Name:', event.name); // Muestra el nombre del evento
        console.log('Event Data:', event.data); // Muestra los datos asociados al evento

        // Para una vista completa y detallada del objeto del evento:
        console.log('Full Paddle Event Object:', JSON.stringify(event, null, 2));

        // Si es un evento de error, los detalles suelen estar en event.data
        if (event.name === 'checkout.error' && event.data && event.data.error) {
          console.error('Paddle Checkout Error Details:', event.data.error);
        }
        console.log('--- End of Paddle Event ---');
      }
    });

    console.log(`Paddle.js inicializado en modo ${paddleEnvironment}.`);
  } else {
    console.error("VITE_PADDLE_CLIENT_TOKEN no está configurado. Paddle.js no se inicializará.");
  }
} else {
  console.error("Paddle.js no encontrado en window. Paddle no funcionará.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
