
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Importar useTranslation

import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth

function LandingHeader() {
  const { user, isAuthenticated } = useAuth(); // Obtener usuario e isAuthenticated
  const { t, i18n } = useTranslation(); // Obtener la función de traducción y el objeto i18n

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

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
            <a href="/#pricing"> {/* Enlace a la sección de precios en la misma página */}
              <Button variant="ghost" className="text-white hover:bg-white/20 px-3 sm:px-4">
                {t('pricing')}
              </Button>
            </a>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className={`text-white hover:bg-white/20 px-2 sm:px-3 ${i18n.language === 'es' ? 'font-bold' : ''}`}
                onClick={() => changeLanguage('es')}
              >
                ES
              </Button>
              <Button
                variant="ghost"
                className={`text-white hover:bg-white/20 px-2 sm:px-3 ${i18n.language === 'en' ? 'font-bold' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                EN
              </Button>
            </div>
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-white/80 hidden sm:block">{user.email}</span>
                <Link to="/dashboard">
                   <Button variant="outline" className="text-white border-white/50 hover:bg-white/20 px-3 sm:px-4">
                     {t('dashboard')}
                   </Button>
                 </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-white hover:bg-white/20 px-3 sm:px-4">
                    {t('login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 shadow-md px-3 sm:px-4">
                    {t('register')}
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
