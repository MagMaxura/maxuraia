import { useEffect } from "react";

export default function PaymentSuccessPage() {
  useEffect(() => {
    // Verifica si existe el parámetro _ptxn
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('_ptxn');
    if (window.Paddle && transactionId) {
      window.Paddle.Setup({ environment: 'production' }); // Cambia a 'sandbox' si usás test
      setTimeout(() => {
        window.Paddle.Checkout.open({ transactionId });
      }, 500);
    }
  }, []);

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