
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

function BenefitsSection() {
  const { t } = useTranslation();

  const benefits = [
    { titleKey: "benefit1_title", descKey: "benefit1_description" },
    { titleKey: "benefit2_title", descKey: "benefit2_description" },
    { titleKey: "benefit3_title", descKey: "benefit3_description" },
    { titleKey: "benefit4_title", descKey: "benefit4_description" }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          {...fadeInWhileInView}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('why_choose_us_title')}
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            {t('why_choose_us_subtitle')}
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
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-white/70">
                  {t(benefit.descKey)}
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
