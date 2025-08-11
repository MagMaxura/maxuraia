
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

function CtaSection() {
  const { t } = useTranslation();
  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeInWhileInView}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {t('cta_title')}
          </h2>
          <p className="text-xl text-white/80 mb-10">
            {t('cta_subtitle')}
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-10 py-3 shadow-xl transform hover:scale-105 transition-transform duration-300">
              {t('get_started')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default CtaSection;
