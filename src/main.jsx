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
      eventCallback: function(event) { // <--- Este es el callback clave
        console.log('Paddle Event:', event); // Muestra todos los eventos para depuración

        if (event.name === 'checkout.closed') {
          // El usuario cerró el modal de checkout sin completar
          console.log('Checkout fue cerrado por el usuario.');
          // Aquí puedes redirigir a la página principal o a la de precios
          // Asegúrate de que la navegación se haga de forma segura
          // Por ejemplo, si estás en un componente React, usarías useNavigate()
          // Dado que esto está en main.jsx, window.location.href es una opción directa,
          // pero considera el impacto en el estado de tu app React.
          // Para una mejor integración con React Router, esta lógica de redirección
          // podría vivir en un contexto o un componente de nivel superior que escuche estos eventos.
          alert('El proceso de pago fue cerrado. Serás redirigido a la página principal.'); // Ejemplo
          window.location.href = '/'; // Redirige a la página principal
        }

        if (event.name === 'checkout.completed') {
          // Este evento indica que el checkout se completó del lado del cliente.
          // La redirección a successUrl generalmente la maneja Paddle automáticamente.
          // Pero puedes realizar acciones adicionales aquí si es necesario.
          console.log('Checkout completado (evento del cliente):', event.data);
        }

        // Puedes escuchar otros eventos como:
        // event.name === 'checkout.payment.failed'
        // event.name === 'checkout.error'
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
