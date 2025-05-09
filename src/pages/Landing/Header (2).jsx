
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

const Header = () => {
  return (
    <header className="fixed w-full bg-white/80 backdrop-blur-lg shadow-sm z-50 border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <Brain className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">EmploySmart IA</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <a href="/#features" className="text-gray-600 hover:text-blue-600 transition-colors">Características</a>
            <a href="/#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonios</a>
            <a href="/#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Precios</a>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="ghost" className="text-blue-600 hover:bg-blue-50">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 shadow-md">
                Prueba Gratuita
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
