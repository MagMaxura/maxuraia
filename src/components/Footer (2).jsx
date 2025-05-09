
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">EmploySmart IA</h3>
            <p className="text-sm mb-4">
              Revolucionando la selección de personal con inteligencia artificial.
            </p>
            <div className="flex space-x-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/#features" className="hover:text-white transition-colors">Características</Link></li>
              <li><Link to="/#pricing" className="hover:text-white transition-colors">Precios</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Registrarse</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Términos de Servicio</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Política de Cookies</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Mail size={16} />
                <a href="mailto:contacto@employsmartia.com" className="hover:text-white transition-colors">contacto@employsmartia.com</a>
              </li>
              {/* Add phone number if applicable */}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} EmploySmart IA. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
