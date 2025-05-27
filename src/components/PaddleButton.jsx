// Archivo: src/components/PaddleButton.jsx

import React from 'react';
import { usePayment } from '@/hooks/usePayment'; // Importa el nuevo hook
import { Button } from '@/components/ui/button'; // Asumo que tienes este componente
import { Loader2 } from 'lucide-react'; // Para el indicador de carga

const PaddleButton = ({
  priceId,         // ID del precio de Paddle (ej: plan.paddlePriceId)
  email,           // Email del usuario (ej: user?.email)
  recruiterId,     // ID del reclutador/usuario (ej: user?.id)
  ctaLabel = 'Comprar ahora',
  successUrl,      // Opcional: URL de éxito específica para este botón
  cancelUrl,       // Opcional: URL de cancelación específica para este botón
  // planDetails y userObject se podrían pasar como objetos completos si se prefiere
}) => {
  const { loadingCheckout, handleCheckout } = usePayment();

  const onButtonClick = () => {
    if (!priceId) {
      console.error("PaddleButton: priceId es requerido.");
      // Podrías usar toast aquí si lo importas y configuras
      alert("Error: Falta el ID del plan."); 
      return;
    }

    // Prepara los datos del plan y del usuario para el hook usePayment
    // El hook espera un objeto 'planDetails' con 'paddlePriceId' y un objeto 'user' con 'id' y 'email'.
    const planDetailsPayload = { paddlePriceId: priceId };
    const userPayload = { id: recruiterId, email: email }; // recruiterId se mapea a userId en el hook

    const dynamicUrls = {};
    if (successUrl) dynamicUrls.successUrl = successUrl;
    if (cancelUrl) dynamicUrls.cancelUrl = cancelUrl;

    handleCheckout(planDetailsPayload, userPayload, dynamicUrls);
  };

  return (
    <Button 
      onClick={onButtonClick} 
      disabled={loadingCheckout}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors" // Clases de ejemplo
    >
      {loadingCheckout ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {ctaLabel}
    </Button>
  );
};

export default PaddleButton;