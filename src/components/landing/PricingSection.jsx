// PricingSection.jsx
// Requiere: framer-motion, lucide-react, APP_PLANS, AuthContext, Button (de ui)
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button'; // Asumo que es de shadcn/ui o similar
import { CheckCircle2, CheckCircle, XCircle } from 'lucide-react'; // Loader2 no se usa aquí
import { APP_PLANS } from '@/config/plans'; // Asegúrate que la ruta sea correcta
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next'; // Importar useTranslation
// import { useToast } from '@/components/ui/use-toast'; // No se usa, se puede quitar si no se añade funcionalidad de toast

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const pricingPlans = Object.values(APP_PLANS);

// Esta estructura de keyFeatures parece ser para la tabla comparativa.
// APP_PLANS[X].features se usa para las características en las cards individuales.
const keyFeatures = [
  { label: 'Puestos activos', keys: ['1', '1', '3', '25', 'Ilimitados'] },
  { label: 'Análisis de CVs', keys: ['10', '75', '100/mes', '1.000/mes', 'Ilimitados'] },
  { label: 'Macheo por IA', keys: ['10', '75', '100', '1.000', 'Ilimitados'] },
  { label: 'Redacción de publicaciones con IA', keys: ['✅', '✅', '✅', '✅', '✅'] },
  { label: 'Preselección IA', keys: ['Manual', 'Manual', 'Manual', 'Avanzada con ranking', 'Ranking y criterios personalizados'] },
  { label: 'Chatbot entrevistas', keys: ['❌', '❌', '❌', '❌', '✅'] },
  { label: 'Soporte', keys: ['Email estándar', 'Email estándar', 'Email estándar', '❌', 'Dedicado 24/7'] },
  { label: 'Personalización', keys: ['❌', '❌', '❌', '❌', 'Incluida'] },
  { label: 'Acceso a métricas', keys: ['❌', '❌', '❌', '❌', 'Consultoría y análisis'] }
];

function PricingSection() {
  const { user, loading: loadingUser } = useAuth(); // Agregado loadingUser para evitar clics prematuros
  const { t } = useTranslation(); // Obtener la función de traducción
  // const { toast } = useToast(); // Descomentar si se usa para notificaciones
  const navigate = useNavigate();

  const handlePlanSelection = (planStripePriceId) => {
    if (loadingUser) return; // No hacer nada si el usuario aún está cargando

    if (!planStripePriceId) {
        console.error("PricingSection: No se proporcionó stripePriceId para la navegación.");
        // toast({ title: "Error", description: "No se pudo seleccionar el plan.", variant: "destructive" });
        return;
    }

    if (user) {
      navigate(`/checkout/${planStripePriceId}`);
    } else {
      // Redirige a login, guardando la intención de ir al checkout después
      navigate('/login', { state: { from: `/checkout/${planStripePriceId}` } });
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-4xl font-bold text-center text-white mb-14">
          {t('pricing_title')}
        </motion.h2>

        {/* Cards de planes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl p-8 border shadow-xl flex flex-col relative overflow-hidden bg-white/10 backdrop-blur-md ${
                plan.isRecommended ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-white/20'
              }`}
            >
              {plan.isRecommended && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-bl-lg">
                  {t('recommended')}
                </div>
              )}
              <h3 className="text-2xl font-semibold text-white mb-2">{t(plan.nameKey)}</h3>
              <p className="text-white/70 text-sm mb-4 h-20 overflow-hidden">{t(plan.descriptionKey)}</p> {/* Altura fija para consistencia */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{plan.priceDisplay}</span>
              </div>
              <ul className="space-y-3 text-white/80 mb-8 flex-grow text-sm">
                {plan.features.slice(0, 5).map((feature, fIndex) => ( // Mostrar solo las primeras 5 características por brevedad
                  <li key={fIndex} className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span>{t(feature)}</span>
                  </li>
                ))}
              </ul>
              {plan.id === 'trial' ? (
                <Link to="/register" className="mt-auto block text-center">
                  <Button
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {t(plan.ctaLabelKey || 'get_started')}
                  </Button>
                </Link>
              ) : plan.type === 'enterprise' ? (
                <a href="#contact" className="mt-auto block text-center">
                  <Button size="lg" className="w-full bg-gray-500 hover:bg-gray-600 text-white">
                    {t(plan.ctaLabelKey || 'contact_sales')}
                  </Button>
                </a>
              ) : (
                <Button
                  size="lg"
                  className="w-full mt-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  onClick={() => handlePlanSelection(plan.stripePriceId)}
                  disabled={loadingUser} // Deshabilita si el usuario está cargando
                >
                  {t(plan.ctaLabelKey || 'choose_plan')}
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Tabla Comparativa */}
        <div className="overflow-x-auto bg-white/5 backdrop-blur-md rounded-xl p-2 shadow-xl border border-white/10">
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 border-b border-white/10 text-white">{t('features_table_header')}</th>
                {pricingPlans.map(p => (
                  <th
                    key={p.id}
                    className={`py-4 px-6 border-b border-white/10 text-center font-semibold text-white ${p.isRecommended ? 'text-yellow-400' : ''}`}
                  >
                    {t(p.nameKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keyFeatures.map((feature, rowIndex) => (
                <tr key={rowIndex} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-6 text-sm font-medium text-white/90">{t(feature.labelKey)}</td>
                  {feature.keys.map((value, colIndex) => (
                    <td
                      key={colIndex}
                      className="py-3 px-6 text-center text-sm text-white/80"
                    >
                      {value === '✅' ? <CheckCircle className="w-5 h-5 mx-auto text-green-400" /> :
                       value === '❌' ? <XCircle className="w-5 h-5 mx-auto text-red-400" /> :
                       value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;