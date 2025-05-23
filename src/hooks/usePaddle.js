import { useState, useEffect } from 'react';

const usePaddle = () => {
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Paddle) {
      setIsPaddleReady(true);
    } else {
      const intervalId = setInterval(() => {
        if (typeof window !== 'undefined' && window.Paddle) {
          setIsPaddleReady(true);
          clearInterval(intervalId);
        }
      }, 50); // Check every 50ms
      return () => clearInterval(intervalId);
    }
  }, []);

  return isPaddleReady;
};

export default usePaddle;