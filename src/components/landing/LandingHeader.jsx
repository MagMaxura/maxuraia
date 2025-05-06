
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

function LandingHeader() {
  return (
    <header className="fixed w-full bg-white/10 backdrop-blur-md z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2"> {/* Link logo to root */}
              <Brain className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">EmploySmart IA</span>
            </Link>
          </div>
{/* --- DEBUG VERSION INDICATOR --- */}
            <span className="text-xs text-yellow-300 ml-4">(v:debug-logs)</span>
            {/* --- END DEBUG --- */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/login"> {/* Link to Login page */}
              <Button variant="ghost" className="text-white hover:bg-white/20 px-3 sm:px-4">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 shadow-md px-3 sm:px-4">
                Prueba Gratuita IA
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default LandingHeader;
