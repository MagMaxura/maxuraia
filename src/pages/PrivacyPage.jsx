import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <>
      <head>
        <title>Política de Privacidad - EmploySmartIA</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Política de Privacidad</h1>

        <section className="mb-12">
          {/* Contenido de Política de Privacidad extraído de LegalPage.jsx (líneas 86-146) */}
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Política de Privacidad</h2>
          <p className="mb-2 text-sm text-gray-600">Última actualización: 14 de mayo de 2025</p>
          <p className="mb-4">
            En EmploySmartIA, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política describe cómo recopilamos, usamos y protegemos tu información.
          </p>

          <h3 className="text-xl font-semibold mb-2">1. Información Recopilada</h3>
          <p className="mb-4">Podemos recopilar los siguientes datos:</p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Información de contacto (nombre, correo electrónico, teléfono).</li>
            <li>Datos profesionales (currículum, experiencia laboral).</li>
            <li>Información de uso del sitio (cookies, dirección IP).</li>
            <li>Datos de navegación y comportamiento en la plataforma.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2. Uso de la Información</h3>
          <p className="mb-4">Utilizamos tus datos para:</p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Proporcionar y mejorar nuestros servicios.</li>
            <li>Personalizar tu experiencia en la plataforma.</li>
            <li>Comunicarnos contigo sobre actualizaciones o promociones.</li>
            <li>Cumplir con obligaciones legales y regulatorias.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">3. Compartir Información</h3>
          <p className="mb-4">No compartimos tus datos personales con terceros, excepto:</p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Cuando sea necesario para proporcionar nuestros servicios.</li>
            <li>Si es requerido por ley o autoridades competentes.</li>
            <li>Con proveedores de servicios que actúan en nuestro nombre y bajo acuerdos de confidencialidad.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">4. Seguridad</h3>
          <p className="mb-4">
            Implementamos medidas de seguridad para proteger tus datos contra accesos no autorizados, alteraciones o destrucción. Estas medidas incluyen:
          </p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Cifrado de datos en tránsito y en reposo.</li>
            <li>Control de acceso basado en roles.</li>
            <li>Monitoreo continuo de sistemas y auditorías de seguridad.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">5. Derechos del Usuario</h3>
          <p className="mb-4">Tienes derecho a:</p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Acceder a tus datos personales.</li>
            <li>Solicitar la corrección de datos inexactos.</li>
            <li>Solicitar la eliminación de tus datos.</li>
            <li>Oponerte al procesamiento de tus datos en ciertas circunstancias.</li>
          </ul>
          <p className="mb-4">Para ejercer estos derechos, contáctanos a través de contacto@ofamazingthings.com.</p>

          <h3 className="text-xl font-semibold mb-2">6. Retención de Datos</h3>
          <p className="mb-4">
            Conservamos tus datos personales mientras sea necesario para cumplir con los fines descritos en esta política, a menos que se requiera o permita un período de retención más largo por ley.
          </p>

          <h3 className="text-xl font-semibold mb-2">7. Cambios en la Política</h3>
          <p className="mb-4">
            Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos y la versión actual estará siempre disponible en nuestro sitio web.
          </p>
        </section>

        <nav className="my-10 border-t pt-6">
          <h3 className="text-lg font-semibold text-center mb-4">Otras Políticas</h3>
          <ul className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <li><Link to="/legal" className="text-blue-600 hover:underline">Información Legal General</Link></li>
            <li><Link to="/terms" className="text-blue-600 hover:underline">Términos y Condiciones</Link></li>
            <li><Link to="/legal#politica-reembolsos" className="text-blue-600 hover:underline">Política de Reembolsos</Link></li>
          </ul>
        </nav>

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

export default PrivacyPage;