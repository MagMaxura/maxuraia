
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const Hero = () => {
  return (
    <section className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div {...fadeIn}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Contrata <span className="text-blue-600">más rápido</span> y <span className="text-indigo-600">mejor</span> con Inteligencia Artificial
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Nuestra plataforma automatiza el análisis de CVs, realiza entrevistas inteligentes y optimiza tu proceso de selección para que encuentres el talento ideal sin esfuerzo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 shadow-lg w-full sm:w-auto">
                Comenzar Prueba Gratuita (7 días)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 text-lg px-8 w-full sm:w-auto">
                Ver Características
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">No requiere tarjeta de crédito.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
