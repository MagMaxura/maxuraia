import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Inicialización de Paddle.js (Comentado para la integración con Stripe)
/*
if (typeof window !== 'undefined' && window.Paddle) {
  const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  const paddleEnvString = import.meta.env.VITE_PADDLE_ENV || 'sandbox';

  if (paddleClientToken) {
    if (paddleEnvString === 'sandbox') {
      window.Paddle.Environment.set('sandbox');
      console.log('Paddle.js: Entorno configurado a SANDBOX.');
    } else if (paddleEnvString === 'production' || paddleEnvString === 'live') {
      window.Paddle.Environment.set('live');
      console.log('Paddle.js: Entorno configurado a LIVE.');
    } else {
      console.warn(`Paddle.js: VITE_PADDLE_ENV ('${paddleEnvString}') no reconocido. Usando sandbox por defecto.`);
      window.Paddle.Environment.set('sandbox');
    }

    window.Paddle.Initialize({
      token: paddleClientToken,
      eventCallback: function(event) {
        console.log('--- Paddle Event Received ---');
        console.log('Event Name:', event.name);
        console.log('Event Data:', event.data);
        console.log('Full Paddle Event Object:', JSON.stringify(event, null, 2));

        if (event.name === 'checkout.error' && event.data && event.data.error) {
          console.error('Paddle Checkout Error Details:', event.data.error);
        }
        
        if (event.name === 'checkout.closed') {
          console.log('El usuario cerró el modal de checkout.');
          // Aquí podrías, por ejemplo, redirigir al usuario a la página principal si lo deseas:
          // if (!event.data?.completed) { // Asegurarse que no fue un cierre post-éxito
          //    window.location.href = '/';
          // }
        }
        if (event.name === 'checkout.payment.failed' || event.name === 'checkout.error') {
           console.error('Paddle Payment Failed/Error Data:', event.data);
        }
        console.log('--- End of Paddle Event ---');
      }
    });
    console.log(`Paddle.js inicializado para el entorno cliente: ${paddleEnvString}.`);
  } else {
    console.error("VITE_PADDLE_CLIENT_TOKEN no está configurado. Paddle.js no se inicializará.");
  }
} else {
  console.error("Paddle.js (window.Paddle) no encontrado. Asegúrate de que el script de Paddle esté cargado en tu index.html. Paddle no funcionará.");
}
*/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);