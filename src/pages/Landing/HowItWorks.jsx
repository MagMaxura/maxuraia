
import React from 'react';
import { motion } from 'framer-motion';

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay }
});

const HowItWorks = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div {...fadeInUp()}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            ¿Cómo funciona? Simple.
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            En 3 sencillos pasos, estarás contratando de forma más inteligente.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <motion.div variants={fadeInUp(0.1)} className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-4 border-blue-200">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Carga CVs o Puestos</h3>
            <p className="text-gray-600 text-sm">Sube los currículums de tus candidatos o define el perfil del puesto que buscas.</p>
          </motion.div>
          <motion.div variants={fadeInUp(0.2)} className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-4 border-indigo-200">
              <span className="text-2xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">La IA Analiza</h3>
            <p className="text-gray-600 text-sm">Nuestra IA procesa la información, identifica habilidades clave y genera rankings.</p>
          </motion.div>
          <motion.div variants={fadeInUp(0.3)} className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-4 border-green-200">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecciona y Contrata</h3>
            <p className="text-gray-600 text-sm">Revisa los mejores perfiles, gestiona entrevistas y toma decisiones informadas.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
