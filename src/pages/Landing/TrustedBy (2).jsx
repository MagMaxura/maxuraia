
import React from 'react';
import { motion } from 'framer-motion';

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay }
});

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const TrustedBy = () => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
          Confían en Nosotros Empresas Líderes
        </h3>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} variants={fadeInUp(i * 0.1)} className="flex justify-center">
              <img  class="h-8 md:h-10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" alt={`Logo de empresa colaboradora ${i + 1}`} src="https://images.unsplash.com/photo-1485531865381-286666aa80a9" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBy;
