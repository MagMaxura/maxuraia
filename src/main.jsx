import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

if (typeof window !== 'undefined' && window.Paddle) {
  const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  const paddleEnvironment = import.meta.env.VITE_PADDLE_ENV || 'sandbox';

  if (paddleClientToken) {
    if (paddleEnvironment === 'sandbox') {
      window.Paddle.Environment.set('sandbox');
    }

    window.Paddle.Initialize({
      token: paddleClientToken,
      checkout: {
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'es'
        }
      },
      eventCallback: function(data) {
        console.log("Paddle Event:", data);
        if (data.name === "checkout.loaded") {
          console.log("Paddle Checkout cargado.");
        }
        if (data.name === "checkout.closed") {
          console.log("Paddle Checkout cerrado. Motivo:", data.data?.reason);
        }
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
