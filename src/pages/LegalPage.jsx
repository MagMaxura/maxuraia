import React from 'react';
import { Link } from 'react-router-dom';

const LegalPage = () => {
  return (
    <>
      <head>
        <title>Términos, Privacidad y Reembolsos - EmploySmartIA</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold mb-4 text-center">Información Legal de EmploySmartIA</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          En esta página encontrarás nuestros Términos y Condiciones de Uso, nuestra Política de Privacidad y nuestra Política de Reembolsos. Te recomendamos leerlos detenidamente.
        </p>

        <nav className="mb-10">
          <ul className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <li><Link to="/terms" className="text-blue-600 hover:underline">Términos y Condiciones</Link></li>
            <li><Link to="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</Link></li>
            <li><a href="#politica-reembolsos" className="text-blue-600 hover:underline">Política de Reembolsos</a></li>
          </ul>
        </nav>

        {/* Las secciones de Términos y Privacidad se han movido a sus propias páginas. */}
        {/* Se mantiene la sección de Reembolsos aquí. */}

        <section id="politica-reembolsos" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Política de Reembolsos</h2>
          <p className="mb-2 text-sm text-gray-600">Última actualización: 14 de mayo de 2025</p>
          <p className="mb-4">
            En EmploySmartIA, nos esforzamos por ofrecer servicios de alta calidad. Si no estás satisfecho con nuestros servicios, esta política describe las condiciones para solicitar un reembolso.
          </p>

          <h3 className="text-xl font-semibold mb-2">1. Condiciones de Reembolso</h3>
          <p className="mb-4">Ofrecemos reembolsos en los siguientes casos:</p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Si experimentas problemas técnicos que impiden el uso del servicio y no podemos resolverlos en un plazo razonable.</li>
            <li>Si cancelas tu suscripción dentro de los primeros 14 días desde la compra inicial.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2. Procedimiento para Solicitar un Reembolso</h3>
          <p className="mb-4">
            Para solicitar un reembolso, envía un correo electrónico a contacto@ofamazingthings.com con la siguiente información:
          </p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Nombre completo.</li>
            <li>Dirección de correo electrónico asociada a la cuenta.</li>
            <li>Motivo de la solicitud.</li>
            <li>Fecha de compra.</li>
          </ul>
          <p className="mb-4">Revisaremos tu solicitud y te responderemos en un plazo de 7 días hábiles.</p>

          <h3 className="text-xl font-semibold mb-2">3. Exclusiones</h3>
          <p className="mb-4">No se otorgarán reembolsos en los siguientes casos:</p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Si el servicio ha sido utilizado en su totalidad.</li>
            <li>Si la solicitud se realiza después de 14 días desde la compra inicial.</li>
            <li>Si se ha violado alguno de nuestros términos y condiciones.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">4. Cancelaciones</h3>
          <p className="mb-4">
            Puedes cancelar tu suscripción en cualquier momento. Sin embargo, no se otorgarán reembolsos por períodos no utilizados después de los primeros 14 días desde la compra inicial.
          </p>

          <h3 className="text-xl font-semibold mb-2">5. Cambios en la Política</h3>
          <p className="mb-4">
            Nos reservamos el derecho de modificar esta política de reembolsos en cualquier momento. Las modificaciones serán efectivas una vez publicadas en nuestro sitio web.
          </p>
        </section>

        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
          >
            Volver a la Página Principal
          </Link>
        </div>
      </div>
    </>
  );
};

export default LegalPage;