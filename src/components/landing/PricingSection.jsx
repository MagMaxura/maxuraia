
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
    name: "Profesional", // Anteriormente "Profesional"
    price: "$12.500", // Actualizar precio
    period: "/mes",
    features: [
      "Hasta 3 Puestos de trabajo activos",
      "Análisis de CVs: Hasta 50/mes",
      "Macheo de candidatos (match IA): Hasta 50 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Manual", // Indicar limitación
      "Soporte: Email estándar",
      "Prueba Gratuita: 7 días"
      // Características no incluidas se omiten o se marcan explícitamente si se cambia el renderizado
    ],
    cta: "Comenzar Prueba",
    popular: false,
    link: "/register" // Enlace para el botón
  },
  {
    name: "Business",
    price: "$69.000", // Actualizar precio
    period: "/mes",
    features: [
      "Hasta 25 Puestos de trabajo activos",
      "Análisis de CVs: Hasta 1.000/mes",
      "Macheo de candidatos (match IA): Hasta 1.000 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Avanzada con ranking",
      "Chatbot para entrevistas automatizadas",
      "Soporte: Prioritario",
      "Integración con otras plataformas: Limitada (1 API)",
      "Personalización: Opcional con costo adicional",
      "Acceso a métricas e informes avanzados",
      "Capacitación a equipos de RRHH: Opcional",
      "Prueba Gratuita: 7 días"
    ],
    cta: "Comenzar Prueba",
    popular: true,
    link: "/register" // Enlace para el botón
  },
  {
    name: "Enterprise",
    price: "Consultar", // Mantener o cambiar a "Contacto"
    period: "",
    features: [
      "Puestos de trabajo activos: Ilimitados",
      "Análisis de CVs: Ilimitado",
      "Macheo de candidatos (match IA): Ilimitado",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Avanzada y adaptable",
      "Chatbot para entrevistas automatizadas: Personalizable",
      "Soporte: Dedicado 24/7",
      "Integración con otras plataformas: Completa",
      "Personalización de funciones / marca blanca: Incluida",
      "Acceso a métricas e informes avanzados: Personalizados",
      "Capacitación a equipos de RRHH: Incluida",
      "Prueba Gratuita: A convenir"
    ],
    cta: "Contactar Ventas",
    popular: false,
    link: "#contact" // Enlace para el botón (asumiendo una sección de contacto)
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
              <Link to={plan.link} className="mt-auto w-full block text-center">
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
