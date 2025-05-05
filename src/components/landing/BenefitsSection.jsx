
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const benefits = [
  { title: "Ahorra Tiempo Valioso", desc: "Reduce hasta un 70% el tiempo dedicado a la revisión manual de CVs y preselección." },
  { title: "Mejora la Calidad de Contratación", desc: "Identifica a los candidatos más adecuados con nuestro ranking basado en IA." },
  { title: "Optimiza tus Recursos", desc: "Automatiza tareas repetitivas y permite a tu equipo enfocarse en entrevistas estratégicas." },
  { title: "Decisiones Basadas en Datos", desc: "Obtén insights objetivos para tomar decisiones de contratación más informadas y justas." }
];

function BenefitsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          {...fadeInWhileInView}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            ¿Por qué elegir EmploySmart IA?
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Optimiza tu proceso de selección, reduce costos y encuentra a los mejores talentos de forma más eficiente.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-4"
            >
              <CheckCircle2 className="h-7 w-7 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-white/70">
                  {benefit.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BenefitsSection;
