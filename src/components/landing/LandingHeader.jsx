
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth

function LandingHeader() {
  const { user, isAuthenticated } = useAuth(); // Obtener usuario e isAuthenticated

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
            {/* <span className="text-xs text-yellow-300 ml-4"> V1"</span> */} {/* Comentado o eliminado */}
            {/* --- END DEBUG --- */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-white/80 hidden sm:block">{user.email}</span>
                {/* Podrías añadir un botón de Logout aquí si es el header principal post-login */}
                {/* <Button onClick={logout} variant="ghost" className="text-white hover:bg-white/20">Logout</Button> */}
                 <Link to="/dashboard">
                   <Button variant="outline" className="text-white border-white/50 hover:bg-white/20 px-3 sm:px-4">
                     Dashboard
                   </Button>
                 </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default LandingHeader;
