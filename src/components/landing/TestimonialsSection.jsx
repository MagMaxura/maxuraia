import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const testimonials = [
  {
    quote: "EmploySmart IA ha transformado nuestra forma de contratar. El análisis de CVs es increíblemente preciso y nos ahorra horas.",
    name: "MBA & Ing. Uranga Maximiliano ",
    title: "CEO, Eternal Provider LLC"
  },
  {
    quote: "La función de preselección automática es genial. Identifica a los mejores candidatos mucho más rápido que antes.",
    name: "Willmott Daniel",
    title: "Gerente de Talento, Potabilizar Solutions S.A"
  },
  {
    quote: "Implementar esta herramienta fue sencillo y el soporte es excelente. ¡Altamente recomendado!",
    name: "Posgr. en RRHH Matias Garcia Conde",
    title: "Especialista en Reclutamiento, Emplotecnia S.R.L"
  }
];

function TestimonialsSection() {
  return (
    <section className="bg-white/5 backdrop-blur-lg py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
          Lo que dicen nuestros clientes
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg flex flex-col"
            >
              <div className="flex-grow mb-4">
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 mr-1" />
                  ))}
                </div>
                <p className="text-white/80 italic text-lg leading-relaxed">
                  <span className="text-3xl text-white mr-1">“</span>{testimonial.quote}<span className="text-3xl text-white ml-1">”</span>
                </p>
              </div>
              <div className="mt-auto">
                <p className="font-semibold text-white text-base">{testimonial.name}</p>
                <p className="text-sm text-white/60">{testimonial.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;