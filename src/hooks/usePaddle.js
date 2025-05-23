// hooks/usePaddle.js
import { useState, useEffect } from 'react';

export default function usePaddle() {
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    const checkPaddle = () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        setIsPaddleReady(true);
      } else {
        // Reintentar después de un tiempo si Paddle no está listo
        setTimeout(checkPaddle, 100);
      }
    };

    checkPaddle();
  }, []);

  return isPaddleReady;
}