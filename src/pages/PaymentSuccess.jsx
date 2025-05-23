import { useEffect } from "react";

export default function PaymentSuccessPage() {
  // Extraer transactionId fuera del useEffect
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get('_ptxn');

  useEffect(() => {
    // Aquí podrías agregar lógica para verificar el estado de la suscripción en Supabase
    // y mostrar un mensaje de confirmación al usuario.
  }, []);src/components/ui/avatar

  return (
    <div
      style={{
        minHeight: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <h2 className="text-2xl font-semibold mb-3">Procesando tu pago...</h2>
      <p className="mb-2">Por favor, no cierres esta ventana hasta completar el pago.</p>
      <p>Se abrirá un formulario seguro de pago en instantes.</p>
    </div>
  );
}