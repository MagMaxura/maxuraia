import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export const usePayment = () => {
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleCheckout = async (nextPlan, user) => {
    setLoadingCheckout(true);
    try {
      const response = await fetch('/api/paddle/generate-pay-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: nextPlan.paddlePriceId,
          userId: user?.id,
          userEmail: user?.email
        })
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.message || 'Error al generar el pago.', variant: "destructive" });
        setLoadingCheckout(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // ¡Asegúrate que generate-pay-link retorne checkoutUrl!
      } else {
        toast({ title: "Error", description: 'No se pudo generar el link de pago.', variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: 'Error al generar el pago.', variant: "destructive" });
    } finally {
      setLoadingCheckout(false);
    }
  };

  return { loadingCheckout, handleCheckout };
};
