
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay }
});

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div {...fadeInUp()}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Planes flexibles para cada necesidad
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte al tamaño y objetivos de tu equipo. Comienza gratis.
          </p>
          {/* Pricing Cards would go here */}
          <div className="p-10 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">(Sección de precios próximamente)</p>
          </div>
          <Link to="/register" className="mt-10 inline-block">
            <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 shadow-lg">
              Comenzar Prueba Gratuita Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
