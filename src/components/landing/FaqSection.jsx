
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
    answer: "Nuestra IA utiliza procesamiento de lenguaje natural (NLP) para extraer información clave de los CVs, como experiencia, habilidades y educación, comparándolos con los requisitos del puesto para generar un ranking de compatibilidad."
  },
  {
    question: "¿Es seguro subir los CVs de los candidatos?",
    answer: "Sí, la seguridad y privacidad son nuestra máxima prioridad. Utilizamos encriptación avanzada y cumplimos con las normativas de protección de datos vigentes para garantizar la confidencialidad de la información."
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
