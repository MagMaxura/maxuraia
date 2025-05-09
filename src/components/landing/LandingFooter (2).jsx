
import React from 'react';
import { Link } from 'react-router-dom';

function LandingFooter() {
  return (
    <footer className="bg-black/20 backdrop-blur-lg py-8 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-7xl mx-auto text-center text-white/60 text-sm">
        © {new Date().getFullYear()} EmploySmart IA. Todos los derechos reservados.
        <div className="mt-2 space-x-4">
          {/* Update these links if you create privacy/terms pages */}
          <Link to="/privacy" className="hover:text-white transition-colors">Política de Privacidad</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Términos de Servicio</Link>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
