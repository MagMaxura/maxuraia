// Archivo: src/hooks/usePaddle.js
// Este hook ha sido comentado como parte de la transición de Paddle a Stripe.
/*
import { useState, useEffect } from 'react';

const PADDLE_SCRIPT_URL = 'https://cdn.paddle.com/paddle/paddle.js';
const VENDOR_ID = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID; // Asegúrate de tener tu Vendor ID en las variables de entorno
const MAX_PADDLE_CHECKS = 10; // Número máximo de intentos para verificar si Paddle está listo
const CHECK_INTERVAL = 500; // Intervalo en ms entre cada verificación

export default function usePaddle() {
  const [isPaddleReady, setIsPaddleReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      // No ejecutar en el servidor
      return;
    }

    // Función para verificar si Paddle está listo
    const checkPaddleReady = (attempts) => {
      if (window.Paddle) {
        console.log('usePaddle: Paddle.js script está listo.');
        // Inicializa Paddle si aún no está inicializado
        if (!window.Paddle.initialized) {
           window.Paddle.Setup({ vendor: VENDOR_ID });
           window.Paddle.initialized = true; // Marca como inicializado para evitar doble setup
           console.log('usePaddle: Paddle.js inicializado.');
        }
        setIsPaddleReady(true);
      } else if (attempts < MAX_PADDLE_CHECKS) {
        // Si no está listo y no hemos excedido los intentos, intenta de nuevo
        setTimeout(() => checkPaddleReady(attempts + 1), CHECK_INTERVAL);
      } else {
        // Si excedimos los intentos, registra un error
        console.warn(`usePaddle: Paddle.js script no encontrado después de ${MAX_PADDLE_CHECKS} intentos.`);
        setError('Paddle.js no pudo ser cargado.');
      }
    };

    // Intenta cargar el script de Paddle si no está ya en la página
    if (!document.querySelector(`script[src="${PADDLE_SCRIPT_URL}"]`)) {
      const script = document.createElement('script');
      script.src = PADDLE_SCRIPT_URL;
      script.onload = () => {
        console.log('usePaddle: Paddle.js script cargado.');
        checkPaddleReady(0); // Comienza a verificar si está listo
      };
      script.onerror = () => {
        console.error('usePaddle: Error al cargar el script de Paddle.js');
        setError('Error al cargar el script de pago.');
      };
      document.body.appendChild(script);
    } else {
      // Si el script ya está en la página, solo verifica si está listo
      checkPaddleReady(0);
    }

    // Limpieza: no es estrictamente necesario para este caso simple,
    // pero es buena práctica si el hook manejara eventos de Paddle
    return () => {
      // Aquí podrías limpiar listeners si los hubiera
    };

  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar

  return {
    isPaddleReady,
    error,
    // Puedes añadir otras funciones de Paddle que necesites exponer
    // Por ejemplo: checkout: window.Paddle?.Checkout
  };
}
*/