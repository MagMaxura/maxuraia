
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20 z-0"></div>
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-white/5 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-400/10 rounded-full filter blur-3xl opacity-60 animate-pulse animation-delay-2000"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div {...fadeIn}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight shadow-text">
            {t('hero_title')}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {t('hero_subtitle')}
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-8 py-3 shadow-xl transform hover:scale-105 transition-transform duration-300">
              {t('get_started')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-white/60">Prueba gratuita de 7 días • No requiere tarjeta</p>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
