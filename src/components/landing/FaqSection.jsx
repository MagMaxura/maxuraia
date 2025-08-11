
import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from 'react-i18next';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

function FaqSection() {
  const { t } = useTranslation();

  const faqs = [
    {
      questionKey: "faq1_question",
      answerKey: "faq1_answer"
    },
    {
      questionKey: "faq2_question",
      answerKey: "faq2_answer"
    },
    {
      questionKey: "faq3_question",
      answerKey: "faq3_answer"
    },
    {
      questionKey: "faq4_question",
      answerKey: "faq4_answer"
    }
  ];

  return (
    <section id="faq" className="bg-white/5 backdrop-blur-lg py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
          {t('faq_title')}
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
                  {t(faq.questionKey)}
                </AccordionTrigger>
                <AccordionContent>
                  {t(faq.answerKey)}
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
