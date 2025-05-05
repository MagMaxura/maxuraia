
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

function CtaSection() {
  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeInWhileInView}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            ¿Listo para transformar tu reclutamiento?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Comienza tu prueba gratuita de 7 días hoy mismo y descubre el poder de la IA en tu proceso de selección.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-10 py-3 shadow-xl transform hover:scale-105 transition-transform duration-300">
              Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default CtaSection;
