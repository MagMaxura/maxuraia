// Archivo: main.jsx (o index.jsx)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App'; // Tu componente principal de la aplicación
import '@/index.css';   // Tus estilos globales

// Inicialización de Paddle.js
if (typeof window !== 'undefined' && window.Paddle) {
  const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  const paddleEnvString = import.meta.env.VITE_PADDLE_ENV || 'sandbox'; // Lee VITE_PADDLE_ENV, default 'sandbox'
  
  // const paddleVendor = import.meta.env.VITE_PADDLE_VENDOR_ID; // NO NECESARIO para Paddle Billing

  if (paddleClientToken) {
    // Configurar el entorno de Paddle.js (sandbox o live)
    if (paddleEnvString === 'sandbox') {
      window.Paddle.Environment.set('sandbox');
      console.log('Paddle.js: Entorno configurado a SANDBOX.');
    } else if (paddleEnvString === 'production' || paddleEnvString === 'live') {
      window.Paddle.Environment.set('live');
      console.log('Paddle.js: Entorno configurado a LIVE.');
    } else {
      console.warn(`Paddle.js: VITE_PADDLE_ENV ('${paddleEnvString}') no reconocido. Usando entorno por defecto de Paddle.js (live). Considera usar 'sandbox' o 'production'.`);
      // Paddle.js por defecto usa 'live' si Environment.set no es llamado o es un valor inválido.
      // Para mayor claridad, podrías forzar sandbox si no es explícitamente production:
      // window.Paddle.Environment.set('sandbox');
      // console.log('Paddle.js: Entorno configurado a SANDBOX por defecto debido a valor no reconocido.');
    }

    window.Paddle.Initialize({
      token: paddleClientToken,
      eventCallback: function(event) {
        console.log('--- Paddle Event Received ---');
        // El console.log(event) simple a veces no expande bien en todas las consolas,
        // por eso es bueno tener los logs específicos y el JSON.stringify.
        // console.log(event); // Puedes mantenerlo o quitarlo si los otros logs son suficientes.
        console.log('Event Name:', event.name);
        console.log('Event Data:', event.data);
        console.log('Full Paddle Event Object:', JSON.stringify(event, null, 2));

        if (event.name === 'checkout.error' && event.data && event.data.error) {
          console.error('Paddle Checkout Error Details:', event.data.error);
        }
        // Aquí puedes añadir lógica para otros eventos si es necesario, por ejemplo:
        // if (event.name === 'checkout.closed') {
        //   console.log('El usuario cerró el modal de checkout.');
        //   // window.location.href = '/'; // Ejemplo de redirección
        // }
        console.log('--- End of Paddle Event ---');
      }
    });

    console.log(`Paddle.js inicializado para el entorno: ${paddleEnvString}.`);
  } else {
    console.error("VITE_PADDLE_CLIENT_TOKEN no está configurado en las variables de entorno. Paddle.js no se inicializará.");
  }
} else {
  // Este error usualmente indica que el script de Paddle.js no se cargó antes que este código.
  // Asegúrate de que <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script> esté en tu index.html, en el <head>.
  console.error("Paddle.js (window.Paddle) no encontrado. Asegúrate de que el script de Paddle esté cargado. Paddle no funcionará.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);