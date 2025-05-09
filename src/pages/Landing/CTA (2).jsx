
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

const CTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div {...fadeInUp()}>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            ¿Listo para transformar tu reclutamiento?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Únete a cientos de empresas que ya contratan de forma más inteligente. ¡Tu prueba gratuita de 7 días te espera!
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-3 shadow-xl font-semibold">
              Empezar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-white/70">Sin compromiso. Sin tarjeta de crédito.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
