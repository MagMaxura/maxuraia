import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <>
      <head>
        <title>Términos y Condiciones - EmploySmartIA</title>
      </head>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Términos y Condiciones de Uso</h1>

        <section className="mb-12">
          {/* Contenido de Términos y Condiciones extraído de LegalPage.jsx (líneas 26-82) */}
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Términos y Condiciones de Uso</h2>
          <p className="mb-2 text-sm text-gray-600">Última actualización: 14 de mayo de 2025</p>
          <p className="mb-4">
            Bienvenido a EmploySmartIA. Al acceder y utilizar nuestro sitio web y servicios, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, por favor, no utilices nuestros servicios.
          </p>

          <h3 className="text-xl font-semibold mb-2">1. Descripción del Servicio</h3>
          <p className="mb-4">
            EmploySmartIA es una plataforma que ofrece soluciones de inteligencia artificial para optimizar procesos de selección y gestión de talento en empresas. Nuestros servicios incluyen, pero no se limitan a:
          </p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Análisis automatizado de currículums.</li>
            <li>Evaluación de candidatos mediante algoritmos de IA.</li>
            <li>Recomendaciones personalizadas para procesos de contratación.</li>
            <li>Integración con sistemas de seguimiento de candidatos (ATS).</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2. Uso Aceptable</h3>
          <p className="mb-4">
            Los usuarios se comprometen a utilizar nuestros servicios de manera legal y ética. Está prohibido:
          </p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Utilizar la plataforma para actividades fraudulentas o ilegales.</li>
            <li>Intentar acceder sin autorización a nuestros sistemas o datos.</li>
            <li>Compartir información confidencial de terceros sin consentimiento.</li>
            <li>Introducir datos falsos o engañosos en el sistema.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">3. Registro y Seguridad de la Cuenta</h3>
          <p className="mb-4">
            Para acceder a ciertas funciones, es necesario registrarse y crear una cuenta. El usuario se compromete a:
          </p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li>Proporcionar información veraz y actualizada.</li>
            <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
            <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">4. Propiedad Intelectual</h3>
          <p className="mb-4">
            Todos los contenidos, marcas y software de EmploySmartIA son propiedad de la empresa o de sus licenciantes y están protegidos por las leyes de propiedad intelectual. No se permite su reproducción o uso sin autorización expresa.
          </p>

          <h3 className="text-xl font-semibold mb-2">5. Limitación de Responsabilidad</h3>
          <p className="mb-4">
            EmploySmartIA no garantiza que los servicios estén libres de errores o interrupciones. No nos hacemos responsables de daños indirectos o consecuentes derivados del uso o imposibilidad de uso de nuestros servicios.
          </p>

          <h3 className="text-xl font-semibold mb-2">6. Modificaciones</h3>
          <p className="mb-4">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones serán efectivas una vez publicadas en nuestro sitio web. Es responsabilidad del usuario revisar periódicamente los términos.
          </p>

          <h3 className="text-xl font-semibold mb-2">7. Ley Aplicable</h3>
          <p className="mb-4">
            Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta en los tribunales competentes de Rosario, Santa Fe.
          </p>
        </section>

        <nav className="my-10 border-t pt-6">
          <h3 className="text-lg font-semibold text-center mb-4">Otras Políticas</h3>
          <ul className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <li><Link to="/legal" className="text-blue-600 hover:underline">Información Legal General</Link></li>
            <li><Link to="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</Link></li>
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

export default TermsPage;