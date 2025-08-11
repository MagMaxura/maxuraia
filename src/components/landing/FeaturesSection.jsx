
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    { icon: FileText, titleKey: "feature1_title", descKey: "feature1_description" },
    { icon: Users, titleKey: "feature2_title", descKey: "feature2_description" },
    { icon: MessageSquare, titleKey: "feature3_title", descKey: "feature3_description" },
  ];

  return (
    <section className="bg-white/5 backdrop-blur-lg py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">{t('features_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:bg-white/20 transition-colors duration-300 shadow-lg"
            >
              <feature.icon className="h-12 w-12 text-white mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-white/70">
                {t(feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
