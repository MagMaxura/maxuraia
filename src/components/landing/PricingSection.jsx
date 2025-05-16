
import React, { useState } from 'react'; // Añadir useState para loading
import { motion } from 'framer-motion';
// import { Link } from 'react-router-dom'; // Link ya no se usará para los botones de pago
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react'; // Añadir Loader2
import { APP_PLANS } from '@/config/plans'; // Importar planes configurados
import { useAuth } from '@/contexts/AuthContext'; // Asumiendo que este es tu hook de autenticación
import { useToast } from "@/components/ui/use-toast"; // Para notificaciones

// Asegúrate de que Paddle.js esté cargado e inicializado en tu app globalmente
// Ejemplo de inicialización (debería estar en main.jsx o App.jsx):
// if (typeof window !== 'undefined' && window.Paddle) {
//   const paddleVendorId = parseInt(import.meta.env.VITE_PADDLE_VENDOR_ID);
//   if (paddleVendorId) {
//      window.Paddle.Setup({ vendor: paddleVendorId });
//   } else {
//      console.error("VITE_PADDLE_VENDOR_ID no está configurado");
//   }
//   // Para Paddle Billing (más nuevo):
//   // const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
//   // if (paddleClientToken) {
//   //   window.Paddle.Initialize({ token: paddleClientToken, environment: 'sandbox' }); // o 'live'
//   // } else {
//   //  console.error("VITE_PADDLE_CLIENT_TOKEN no está configurado");
//   // }
// }


const fadeInWhileInView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const pricingPlans = [
  {
    name: "Búsqueda Puntual",
    price: "$18.000",
    period: "pago único",
    features: [
      "1 Puesto de trabajo activo",
      "Análisis de CVs: Hasta 100",
      "Macheo de candidatos (match IA): Hasta 100 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Manual",
      "Soporte: Email estándar",
      "Ideal para emprendedores y pequeñas empresas",
    ],
    cta: "Comprar Ahora",
    planId: "busqueda_puntual",
    popular: false,
  },
  {
    name: "Profesional", // Anteriormente "Profesional"
    price: "$12.500", // Actualizar precio
    period: "/mes",
    features: [
      "Hasta 3 Puestos de trabajo activos",
      "Análisis de CVs: Hasta 50/mes",
      "Macheo de candidatos (match IA): Hasta 50 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Manual", // Indicar limitación
      "Soporte: Email estándar",
      "Prueba Gratuita: 7 días"
      // Características no incluidas se omiten o se marcan explícitamente si se cambia el renderizado
    ],
    cta: "Suscribirse Ahora", // Cambiado de "Comenzar Prueba"
    planId: "profesional_monthly", // ID para buscar en APP_PLANS
    popular: false,
    // link: "/register" // Ya no se usa link directo para el pago
  },
  {
    name: "Business",
    price: "$69.000",
    period: "/mes",
    features: [
      "Hasta 25 Puestos de trabajo activos",
      "Análisis de CVs: Hasta 1.000/mes",
      "Macheo de candidatos (match IA): Hasta 1.000 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Avanzada con ranking",
      "Chatbot para entrevistas automatizadas",
      "Soporte: Prioritario",
      "Integración con otras plataformas: Limitada (1 API)",
      "Personalización: Opcional con costo adicional",
      "Acceso a métricas e informes avanzados",
            // "Prueba Gratuita: 7 días" // Eliminado según feedback
    ],
    cta: "Suscribirse Ahora", // Cambiado de "Comenzar Prueba"
    planId: "empresa_monthly", // ID para buscar en APP_PLANS
    popular: true,
    // link: "/register" // Ya no se usa link directo para el pago
  },
  {
    name: "Enterprise",
    price: "$300.000",
    period: "/mes",
    features: [ // Características del plan Enterprise de src/config/plans.js
      "Puestos de trabajo activos: Ilimitados",
      "Análisis de CVs: Ilimitados",
      "Macheo de candidatos (match IA): Ilimitados",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Avanzada con ranking y personalización de criterios",
      "Chatbot para entrevistas automatizadas: Con personalización avanzada de flujos",
      "Soporte: Dedicado 24/7 con Account Manager",
      "Integración con otras plataformas: Completa (Múltiples APIs y sistemas)",
      "Personalización de la plataforma y reportes: Incluida",
      "Acceso a métricas e informes avanzados: Con consultoría y análisis personalizado",
      "Acceso anticipado a nuevas funcionalidades Beta",
    ],
    cta: "Contactar Ventas",
    planId: "enterprise_monthly", // ID para buscar en APP_PLANS
    popular: false,
    link: "#contact" // Mantener si es para un ancla de contacto
  }
];

function PricingSection() {
  const { user } = useAuth(); // Obtener usuario del contexto
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState(null); // Para mostrar spinner en el botón

  const handleSubscription = async (planIdForApp) => {
    if (!window.Paddle) {
      console.error("Paddle.js no está cargado.");
      toast({ title: "Error", description: "El sistema de pagos no está disponible en este momento. Por favor, intente más tarde.", variant: "destructive" });
      return;
    }

    const selectedPlan = APP_PLANS[planIdForApp];
    if (!selectedPlan || !selectedPlan.paddlePriceId) {
      console.error("Configuración de plan de Paddle no encontrada para:", planIdForApp);
      toast({ title: "Error", description: "Plan no configurable para pago. Contacte a soporte.", variant: "destructive" });
      return;
    }

    setLoadingPlan(planIdForApp);

    try {
      const response = await fetch('/api/paddle/generate-pay-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedPlan.paddlePriceId,
          userId: user?.id, // Enviar userId si el usuario está logueado
          userEmail: user?.email, // Enviar email si el usuario está logueado
          // successUrl: `${window.location.origin}/payment-success?plan=${planIdForApp}`,
          // cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al generar el enlace de pago.');
      }
      
      // Para Paddle Billing, se espera un transactionId o checkout.url
      // La API simulada devuelve transactionId y checkoutUrl
      if (data.transactionId) { // Preferible para Paddle.js con Paddle Billing
         window.Paddle.Checkout.open({
           transactionId: data.transactionId,
           // También puedes pasar `customer` y `customData` aquí si no los pasaste al backend
           // customer: user ? { email: user.email, id: user.id } : undefined,
           // customData: { userId: user?.id, appPlanId: planIdForApp },
         });
      } else if (data.checkoutUrl) { // Como fallback si la API devuelve una URL directa
         window.Paddle.Checkout.open({
           override: data.checkoutUrl,
         });
      } else {
        throw new Error('Respuesta de API de pago inválida.');
      }

    } catch (error) {
      console.error("Error al procesar la suscripción:", error);
      toast({ title: "Error de Suscripción", description: error.message || "No se pudo iniciar el proceso de pago.", variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2 {...fadeInWhileInView} className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">
          Planes Flexibles para cada Necesidad
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white/10 backdrop-blur-md rounded-xl p-8 border ${plan.popular ? 'border-indigo-400 border-2' : 'border-white/20'} shadow-xl flex flex-col relative overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">Más Popular</div>
              )}
              <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-white/70">{plan.period}</span>
              </div>
              <ul className="space-y-3 text-white/80 mb-8 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.name === "Enterprise" ? (
                <a href="#contact" className="mt-auto w-full block text-center"> {/* Asumiendo que #contact es un ancla */}
                  <Button size="lg" className="w-full bg-gray-500 hover:bg-gray-600 text-white">
                    {plan.cta}
                  </Button>
                </a>
              ) : (
                <Button
                  size="lg"
                  className={`w-full mt-auto ${plan.popular ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-white text-blue-700 hover:bg-gray-100'}`}
                  onClick={() => handleSubscription(plan.planId)}
                  disabled={loadingPlan === plan.planId}
                >
                  {loadingPlan === plan.planId ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {plan.cta}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
