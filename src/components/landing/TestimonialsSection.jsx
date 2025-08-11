import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      quoteKey: "testimonial1_quote",
      nameKey: "testimonial1_name",
      titleKey: "testimonial1_title"
    },
    {
      quoteKey: "testimonial2_quote",
      nameKey: "testimonial2_name",
      titleKey: "testimonial2_title"
    },
    {
      quoteKey: "testimonial3_quote",
      nameKey: "testimonial3_name",
      titleKey: "testimonial3_title"
    }
  ];

  return (
    <section className="bg-white/5 backdrop-blur-lg py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
          {t('testimonials_section_title')}
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
                  <span className="text-3xl text-white mr-1">“</span>{t(testimonial.quoteKey)}<span className="text-3xl text-white ml-1">”</span>
                </p>
              </div>
              <div className="mt-auto">
                <p className="font-semibold text-white text-base">{t(testimonial.nameKey)}</p>
                <p className="text-sm text-white/60">{t(testimonial.titleKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;