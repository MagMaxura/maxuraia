
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, MessageSquare, Calendar, Zap, Clock } from 'lucide-react';

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay }
});

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const featuresData = [
  { icon: FileText, title: "Análisis Inteligente de CVs", description: "Extrae y evalúa habilidades, experiencia y adecuación al puesto automáticamente." },
  { icon: Search, title: "Matching Avanzado", description: "Algoritmos de IA que clasifican candidatos según los requisitos del puesto." },
  { icon: MessageSquare, title: "Entrevistas con IA", description: "Chatbots para realizar screenings iniciales y evaluar competencias clave." },
  { icon: Calendar, title: "Gestión Simplificada", description: "Centraliza todo el proceso: publica ofertas, agenda entrevistas y sigue a los candidatos." },
  { icon: Zap, title: "Automatización Total", description: "Reduce tareas manuales y acelera cada etapa del reclutamiento." },
  { icon: Clock, title: "Ahorro de Tiempo y Costos", description: "Optimiza recursos y contrata más rápido al talento adecuado." },
];

const Features = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp()} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Todo lo que necesitas para un reclutamiento inteligente
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Desde la atracción hasta la contratación, potencia cada paso con IA.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {featuresData.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp(index * 0.1)}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <feature.icon className="h-10 w-10 text-blue-600 mb-5" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
