import React from 'react';
import { useStripePayment } from '@/hooks/useStripePayment'; // Importa el nuevo hook de Stripe
import { Button } from '@/components/ui/button'; // Asumo que tienes este componente
import { Loader2 } from 'lucide-react'; // Para el indicador de carga

const StripeButton = ({
  priceId,         // ID del precio de Stripe (ej: plan.stripePriceId)
  email,           // Email del usuario (ej: user?.email)
  recruiterId,     // ID del reclutador/usuario (ej: user?.id)
  ctaLabel = 'Comprar ahora',
  successUrl,      // Opcional: URL de éxito específica para este botón
  cancelUrl,       // Opcional: URL de cancelación específica para este botón
}) => {
  const { loadingCheckout, handleCheckout, error } = useStripePayment();

  const onButtonClick = () => {
    if (!priceId) {
      console.error("StripeButton: priceId es requerido.");
      // Podrías usar toast aquí si lo importas y configuras
      alert("Error: Falta el ID del precio de Stripe.");
      return;
    }

    // Llama al hook de Stripe con los datos necesarios
    handleCheckout(priceId, recruiterId, email, { successUrl, cancelUrl });
  };

  // Opcional: mostrar un mensaje de error si el hook reporta uno
  if (error) {
    console.error("Error en StripeButton:", error);
    // Podrías mostrar un toast o un mensaje en la UI
  }

  return (
    <Button
      onClick={onButtonClick}
      disabled={loadingCheckout}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors" // Clases de ejemplo para diferenciar
    >
      {loadingCheckout ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {ctaLabel}
    </Button>
  );
};

export default StripeButton;