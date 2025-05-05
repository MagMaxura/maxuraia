
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const pricingPlans = [
  {
    name: "Profesional",
    price: "€49",
    period: "/mes",
    features: [
      "Hasta 5 Puestos Activos",
      "Análisis de 100 CVs/mes",
      "Preselección IA Básica",
      "Soporte por Email"
    ],
    cta: "Comenzar Prueba",
    popular: false
  },
  {
    name: "Business",
    price: "€99",
    period: "/mes",
    features: [
      "Hasta 20 Puestos Activos",
      "Análisis de 500 CVs/mes",
      "Preselección IA Avanzada",
      "Chatbot Entrevistador",
      "Soporte Prioritario"
    ],
    cta: "Comenzar Prueba",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Contacto",
    period: "",
    features: [
      "Puestos Ilimitados",
      "Análisis Ilimitado de CVs",
      "Funciones Personalizadas",
      "Integraciones API",
      "Soporte Dedicado"
    ],
    cta: "Contactar Ventas",
    popular: false
  }
];

function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
          Planes Flexibles para cada Necesidad
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white/10 backdrop-blur-md rounded-xl p-8 border ${plan.popular ? 'border-indigo-400 border-2' : 'border-white/20'} shadow-xl flex flex-col relative overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">Más Popular</div>
              )}
              <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-white/70">{plan.period}</span>
              </div>
              <ul className="space-y-3 text-white/80 mb-8 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to={plan.name === 'Enterprise' ? '#contact' : '/register'} className="mt-auto w-full block text-center">
                <Button size="lg" className={`w-full ${plan.popular ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-white text-blue-700 hover:bg-gray-100'}`}>
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
