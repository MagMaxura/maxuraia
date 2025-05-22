
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, MessageSquare } from 'lucide-react';

const features = [
  { icon: FileText, title: "Análisis Inteligente de CVs", desc: "Extrae y analiza datos clave de currículums en segundos." },
  { icon: Users, title: "Preselección Automática", desc: "Rankea candidatos basado en compatibilidad con el puesto." },
  { icon: MessageSquare, title: "Chatbot Entrevistador", desc: "Realiza entrevistas preliminares y evalúa respuestas." },
];

function FeaturesSection() {
  return (
    <section className="bg-white/5 backdrop-blur-lg py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">Funcionalidades Clave</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:bg-white/20 transition-colors duration-300 shadow-lg"
            >
              <feature.icon className="h-12 w-12 text-white mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
