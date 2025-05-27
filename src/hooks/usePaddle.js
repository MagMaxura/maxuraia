// Archivo: src/hooks/usePaddle.js
import { useState, useEffect } from 'react';

const MAX_PADDLE_CHECKS = 50; // Intentar por 5 segundos (50 * 100ms)
const PADDLE_CHECK_INTERVAL = 100; // ms

export default function usePaddle() {
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let timeoutId = null;

    const checkPaddleScript = () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        console.log('usePaddle: Paddle.js script está listo.');
        setIsPaddleReady(true);
        if (timeoutId) clearTimeout(timeoutId); // Detener polling
      } else {
        attempts++;
        if (attempts < MAX_PADDLE_CHECKS) {
          timeoutId = setTimeout(checkPaddleScript, PADDLE_CHECK_INTERVAL);
        } else {
          console.warn(`usePaddle: Paddle.js script no encontrado después de ${MAX_PADDLE_CHECKS} intentos.`);
        }
      }
    };

    checkPaddleScript();

    return () => { // Función de limpieza
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Se ejecuta solo una vez al montar

  return isPaddleReady;
}