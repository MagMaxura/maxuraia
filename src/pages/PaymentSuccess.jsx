// Archivo: pages/PaymentSuccess.jsx

import React from 'react';
import { Link } from 'react-router-dom'; // Opcional: para enlaces de "Volver al Dashboard"

import { useLocation } from 'react-router-dom'; // Importa useLocation

const PaymentSuccess = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('session_id'); // Obtiene el session_id de la URL

  // Opcional: Puedes loggear el sessionId para depuración
  console.log('Stripe Checkout Session ID:', sessionId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
      <div className="bg-white p-8 sm:p-12 rounded-lg shadow-xl max-w-md w-full">
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">¡Pago Exitoso!</h1>
        <p className="text-gray-600 mb-6 sm:text-lg">
          Gracias por tu compra. Tu suscripción o producto ya debería estar activo.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Si tienes alguna pregunta o el acceso no se refleja inmediatamente, por favor contacta a nuestro equipo de soporte. A veces, la actualización puede tardar unos instantes en procesarse completamente.
        </p>
        {/* Opcional: Añadir un botón para volver al dashboard o a la página principal */}
        <Link
          to="/dashboard" // Ajusta esta ruta a tu dashboard
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-150"
        >
          Ir a mi Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;