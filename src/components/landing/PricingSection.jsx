// Requiere: framer-motion, lucide-react, APP_PLANS, AuthContext, useToast, Button
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { APP_PLANS } from '@/config/plans';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const pricingPlans = Object.values(APP_PLANS);

const keyFeatures = [
  { label: 'Puestos activos', keys: ['1', '3', '25', 'Ilimitados'] },
  { label: 'Análisis de CVs', keys: ['75', '100/mes', '1.000/mes', 'Ilimitados'] },
  { label: 'Macheo por IA', keys: ['75', '100', '1.000', 'Ilimitados'] },
  { label: 'Preselección IA', keys: ['Manual', 'Manual', 'Avanzada con ranking', 'Ranking y criterios personalizados'] },
  { label: 'Chatbot entrevistas', keys: ['❌', '❌', '✅', '✅'] },
  { label: 'Soporte', keys: ['Email estándar', 'Email estándar', 'Prioritario', 'Dedicado 24/7'] },
  { label: 'Personalización', keys: ['❌', '❌', 'Opcional', 'Incluida'] },
  { label: 'Acceso a métricas', keys: ['❌', '❌', 'Avanzado', 'Consultoría y análisis'] }
];

function PricingSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSubscription = async (planId) => {
    if (!window.Paddle) {
      toast({ title: "Error", description: "El sistema de pagos no está disponible.", variant: "destructive" });
      return;
    }

    const selectedPlan = APP_PLANS[planId];
    if (!selectedPlan || !selectedPlan.paddlePriceId) {
      toast({ title: "Error", description: "Este plan no está disponible para pago online.", variant: "destructive" });
      return;
    }

    setLoadingPlan(planId);

    try {
      const response = await fetch('/api/paddle/generate-pay-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedPlan.paddlePriceId,
          userId: user?.id,
          userEmail: user?.email
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      if (data.transactionId) {
        window.Paddle.Checkout.open({ transactionId: data.transactionId });
      } else if (data.checkoutUrl) {
        window.Paddle.Checkout.open({ override: data.checkoutUrl });
      } else {
        throw new Error('No se pudo iniciar el checkout');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-4xl font-bold text-center text-white mb-14">
          Planes Flexibles para cada Necesidad
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
                  Recomendado
                </div>
              )}
              <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
              <p className="text-white/70 text-sm mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{plan.priceDisplay}</span>
              </div>
              <ul className="space-y-3 text-white/80 mb-8 flex-grow text-sm">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.type === 'enterprise' ? (
                <a href="#contact" className="mt-auto block text-center">
                  <Button size="lg" className="w-full bg-gray-500 hover:bg-gray-600 text-white">
                    {plan.ctaLabel || 'Contactar Ventas'}
                  </Button>
                </a>
              ) : (
                <Button
                  size="lg"
                  className={`w-full mt-auto ${
                    plan.isRecommended ? 'bg-yellow-400 hover:bg-yellow-300 text-black' : 'bg-white text-blue-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSubscription(plan.id)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {plan.ctaLabel || 'Elegir'}
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Tabla Comparativa */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-white/10">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 border-b border-white/10">Características</th>
                {pricingPlans.map(plan => (
                  <th
                    key={plan.id}
                    className={`py-4 px-6 border-b border-white/10 text-center font-semibold ${plan.isRecommended ? 'text-yellow-400' : ''}`}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keyFeatures.map((feature, rowIndex) => (
                <tr key={rowIndex} className="border-t border-white/10">
                  <td className="py-3 px-6 text-sm font-medium text-white/90">{feature.label}</td>
                  {feature.keys.map((value, colIndex) => (
                    <td
                      key={colIndex}
                      className="py-3 px-6 text-center text-sm"
                    >
                      {value === '✅' ? <CheckCircle className="w-5 h-5 mx-auto text-green-400" /> :
                       value === '❌' ? <XCircle className="w-5 h-5 mx-auto text-red-500" /> :
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
