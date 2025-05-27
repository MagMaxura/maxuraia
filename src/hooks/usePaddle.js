// hooks/usePaddle.js
import { useState, useEffect } from 'react';

export default function usePaddle() {
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    const checkPaddle = () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        setIsPaddleReady(true);
        // Opcional: puedes añadir un console.log aquí si quieres saber cuándo está listo
        // console.log('usePaddle: Paddle.js está listo.');
      } else {
        // Reintentar después de un tiempo si Paddle no está listo
        // Este es un polling simple. Considera añadir un límite de reintentos o un timeout
        // para evitar un bucle infinito si Paddle.js nunca carga por alguna razón.
        // También, un cleanup para el setTimeout sería bueno.
        setTimeout(checkPaddle, 100);
      }
    };

    checkPaddle();

    // Es buena práctica añadir un cleanup para cualquier setTimeout o setInterval en useEffect
    // aunque en este caso, una vez que isPaddleReady es true, el polling se detiene.
    // Sin embargo, si el componente se desmonta ANTES de que Paddle esté listo,
    // el timeout podría intentar llamar a setIsPaddleReady en un componente no montado.
    // Un cleanup más robusto se vería así:
    /*
    let timeoutId;
    const checkPaddle = () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        setIsPaddleReady(true);
      } else {
        timeoutId = setTimeout(checkPaddle, 100);
      }
    };
    checkPaddle();
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    */
  }, []); // El array vacío asegura que esto se ejecute solo una vez (al montar)

  return isPaddleReady;
}