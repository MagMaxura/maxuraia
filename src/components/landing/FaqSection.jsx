
import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const faqs = [
  {
    question: "¿Cómo funciona el análisis de CVs con IA?",
    answer: "Nuestra IA utiliza algoritmos avanzados para analizar el contenido de los CVs de los candidatos y compararlo con los requisitos de las ofertas de trabajo publicadas, destacando las coincidencias clave y generando un ranking de compatibilidad."
  },
  {
    question: "¿Es seguro subir los CVs de los candidatos?",
    answer: "Sí, la seguridad de los datos de los candidatos y de tu empresa es nuestra prioridad. Utilizamos cifrado de extremo a extremo y cumplimos con las normativas de privacidad y protección de datos vigentes."
  },
  {
    question: "¿Puedo personalizar los criterios de preselección?",
    answer: "¡Claro! Puedes definir los requisitos específicos, habilidades clave y palabras clave para cada puesto, permitiendo que nuestra IA ajuste el análisis a tus necesidades exactas."
  },
  {
    question: "¿Ofrecen un período de prueba gratuito?",
    answer: "Sí, ofrecemos una prueba gratuita de 7 días en nuestros planes Profesional y Business para que puedas experimentar todo el potencial de EmploySmart IA sin compromiso."
  }
];

function FaqSection() {
  return (
    <section id="faq" className="bg-white/5 backdrop-blur-lg py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
          Preguntas Frecuentes
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

export default FaqSection;
