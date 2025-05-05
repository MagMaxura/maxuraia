
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

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

const testimonialsData = [
  {
    quote: "EmploySmart IA transformó nuestro proceso de selección. ¡Redujimos el tiempo de contratación en un 50%!",
    name: "Ana García",
    title: "Directora de RRHH, Tech Solutions",
    image: "Testimonio de Ana García sonriendo",
    alt: "Foto de Ana García"
  },
  {
    quote: "La precisión del análisis de CVs es impresionante. Encontramos candidatos que antes pasábamos por alto.",
    name: "Carlos Martínez",
    title: "Gerente de Talento, Innovate Corp",
    image: "Testimonio de Carlos Martínez con gafas",
    alt: "Foto de Carlos Martínez"
  },
  {
    quote: "La interfaz es intuitiva y el soporte al cliente es excelente. Muy recomendable.",
    name: "Laura Fernández",
    title: "Especialista en Reclutamiento, Global Enterprises",
    image: "Testimonio de Laura Fernández en oficina",
    alt: "Foto de Laura Fernández"
  }
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp()} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Empresas como la tuya ya están optimizando su reclutamiento con nosotros.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {testimonialsData.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp(index * 0.1)}
              className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 shadow-lg flex flex-col"
            >
              <div className="flex-grow mb-4">
                <Star className="text-yellow-400 w-5 h-5 inline-block mr-1" />
                <Star className="text-yellow-400 w-5 h-5 inline-block mr-1" />
                <Star className="text-yellow-400 w-5 h-5 inline-block mr-1" />
                <Star className="text-yellow-400 w-5 h-5 inline-block mr-1" />
                <Star className="text-yellow-400 w-5 h-5 inline-block" />
                <p className="italic text-white/90 mt-4">"{testimonial.quote}"</p>
              </div>
              <div className="flex items-center mt-auto pt-4 border-t border-white/20">
                <img  class="h-12 w-12 rounded-full mr-4 object-cover border-2 border-white/50" alt={testimonial.alt} src="https://images.unsplash.com/photo-1694388001616-1176f534d72f" />
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-white/70">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
