/**
 * Define los planes de la aplicación y su mapeo con los IDs de producto y precio de Paddle.
 * ¡Verifica que paddlePriceId coincida con tu dashboard de Paddle!
 */
export const APP_PLANS = {
  // Nuevo plan Trial
  trial: {
    id: 'trial',
    name: 'Plan de Prueba',
    stripeProductId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'prod_YOUR_TRIAL_TEST_PRODUCT_ID' : 'prod_XXXXXXX', // Reemplazar con ID de producto de Stripe real si aplica
    stripePriceId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'price_YOUR_TRIAL_TEST_PRICE_ID' : 'price_XXXXXXX', // Reemplazar con ID de precio de Stripe real si aplica
    priceDisplay: 'Gratis',
    priceNumeric: 0,
    type: 'trial',
    periodicity: 'periodo de prueba',
    ctaLabel: 'Empezar Prueba',
    description: 'Prueba todas las funcionalidades básicas de Employ Smart IA por un tiempo limitado.',
    cvLimit: 10, // Ajustar según la definición real del plan trial
    jobLimit: 1, // Límite de 1 puesto activo para el plan trial
    features: [
      "Te damos la posibilidad de probar la mejor herramienta reclutamiento",
      "1 Puesto de trabajo activo",
      "Análisis de CVs: Hasta 10", // Ajustar según la definición real
      "Macheo de candidatos (match IA): Hasta 10", // Ajustar según la definición real
    ],
    matchLimit: 10 // Nuevo: Límite de macheos
  },
  busqueda_puntual: {
    id: 'busqueda_puntual',
    name: 'Employ Smart IA - Búsqueda Puntual',
    stripeProductId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'prod_SP3ceC9zv6TSJO' : 'prod_SOuIhd2wtVyKlt', // Product ID de Stripe para Búsqueda Puntual
    stripePriceId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'price_1RUFVEA5iob5uvoTOCXpgQtD' : 'price_1RU6U4A5iob5uvoTs9J8cvob', // Price ID de Stripe para Búsqueda Puntual
    priceDisplay: 'ARS 25,000.00', // Mantener display si es el mismo precio de prueba
    priceNumeric: 2500000, // Mantener numeric si es el mismo precio de prueba
    type: 'one-time',
    periodicity: 'único por puesto',
    ctaLabel: 'Empezar ahora',
    description: 'Ideal para emprendedores y pequeñas empresas con necesidades de reclutamiento específicas y puntuales.',
    cvLimit: 75,
    jobLimit: 1, // Añadido: Límite de puestos de trabajo activos
    features: [
      "1 Puesto de trabajo activo",
      "Análisis de CVs: Hasta 75",
      "Macheo de candidatos (match IA): Hasta 75 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Manual",
      "Soporte: Email estándar"
    ],
    matchLimit: 75 // Nuevo: Límite de macheos
  },
  profesional_monthly: {
    id: 'profesional_monthly',
    name: 'Employ Smart IA - Plan Profesional',
    // paddleProductId: 'pro_01jvsmnsj3hhfnyt0y89rawyn4', // Comentado para Stripe
    // paddlePriceId: 'pri_01jvsn7rjbv61144k9ztfrscjr', // Comentado para Stripe
    stripeProductId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'prod_SP3bTBrf7tFsyt' : 'prod_SOuQ5ACG8YX7vu', // Product ID de Stripe para Plan Profesional
    stripePriceId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'price_1RUFUfA5iob5uvoTwfgZtdfi' : 'price_1RU6bpA5iob5uvoT2c5VkaIf', // Price ID de Stripe para Plan Profesional
    priceDisplay: 'ARS 18,500.00/mes', // Cambiado a "/mes"
    priceNumeric: 1850000, // Mantener numeric si es el mismo precio de prueba
    type: 'monthly',
    ctaLabel: 'Comenzar ahora',
    description: 'Cuota mensual para usar la mejor herramienta de reclutamiento.',
    cvLimit: 100,
    jobLimit: 3, // Añadido: Límite de puestos de trabajo activos
    features: [
      "Hasta 3 Puestos de trabajo activos",
      "Análisis de CVs: Hasta 100/mes",
      "Macheo de candidatos (match IA): Hasta 100 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Manual",
      "Soporte: Email estándar"
    ],
    matchLimit: 100 // Nuevo: Límite de macheos
  },
  empresa_monthly: {
    id: 'empresa_monthly',
    name: 'Employ Smart IA - Plan Business',
    // paddleProductId: 'pro_01jvsmjxcwypkdaxkcvas8q9mw', // Comentado para Stripe
    // paddlePriceId: 'pri_01jvsmm8vm50zz6q025w5sxkns', // Comentado para Stripe
    stripeProductId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'prod_SUd4buH7r8OzBI' : 'prod_SOuKUAX4QG2rY5', // Product ID de Stripe para Plan Empresa
    stripePriceId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'price_1RZdoQA5iob5uvoTH6v1iswz' : 'price_1RU6WHA5iob5uvoTNoQ7eIbl', // Price ID de Stripe para Plan Empresa
    priceDisplay: 'ARS 69,000.00/month',
    priceNumeric: 6900000,
    type: 'monthly',
    isRecommended: true,
    ctaLabel: 'Elegir Business',
    description: 'Automatizá tus procesos con IA y liberá a tu equipo de RRHH.',
    cvLimit: 1000,
    jobLimit: 25, // Añadido: Límite de puestos de trabajo activos
    features: [
      "Hasta 25 Puestos de trabajo activos",
      "Análisis de CVs: Hasta 1.000/mes",
      "Macheo de candidatos (match IA): Hasta 1.000 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Avanzada con ranking",
      "Chatbot para entrevistas automatizadas",
      "Soporte: Prioritario",
      "Acceso a métricas e informes avanzados"
    ],
    matchLimit: 1000 // Nuevo: Límite de macheos
  },
  enterprise_monthly: {
    id: 'enterprise_monthly',
    name: 'Employ Smart IA - Plan Enterprise',
    // paddleProductId: 'pro_01jvsnkm4n8ry8h3p1an42ytv2', // Comentado para Stripe
    // paddlePriceId: 'pri_01jvsnnm2gtv294yv4wz7ns21y', // Comentado para Stripe
    stripeProductId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'prod_SUdC0wywP6bPA2' : 'prod_SOuKnG1aCIacRl', // Product ID de Stripe para Plan Enterprise
    stripePriceId: import.meta.env.VITE_STRIPE_MODE === 'test' ? 'price_1RZdvgA5iob5uvoTxTOhJ0ln' : 'price_1RU6VeA5iob5uvoTV3yXvMVt', // Price ID de Stripe para Plan Enterprise
    priceDisplay: 'ARS 300,000.00/month',
    priceNumeric: 30000000,
    type: 'enterprise',
    ctaLabel: 'Solicitar demo',
    description: 'Solución integral y personalizada para grandes empresas con necesidades avanzadas de reclutamiento.',
    cvLimit: Infinity,
    jobLimit: Infinity, // Añadido: Límite de puestos de trabajo activos
    features: [
      "Puestos de trabajo activos: Ilimitados",
      "Análisis de CVs: Ilimitados",
      "Macheo de candidatos (match IA): Ilimitados",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Avanzada con ranking y personalización de criterios",
      "Chatbot para entrevistas automatizadas: Con personalización avanzada de flujos",
      "Soporte: Dedicado 24/7 con Account Manager",
      "Personalización de la plataforma y reportes: Incluida",
      "Acceso a métricas e informes avanzados: Con consultoría y análisis personalizado",
      "Acceso anticipado a nuevas funcionalidades Beta"
    ],
    matchLimit: Infinity // Nuevo: Límite de macheos
  }
};

export const PLAN_HIERARCHY = {
  trial: { next: 'profesional_monthly', name: 'Profesional' },
  profesional_monthly: { next: 'empresa_monthly', name: 'Business' },
  empresa_monthly: { next: 'enterprise_monthly', name: 'Enterprise' },
  enterprise_monthly: null,
};

export const PLAN_CV_ANALYSIS_LIMITS = {
  trial: 10,
  busqueda_puntual: 75,
  profesional_monthly: 100,
  empresa_monthly: 1000,
  enterprise_monthly: Infinity,
  enterprise: Infinity
};

export const getPlanById = (planId) => {
  return APP_PLANS[planId];
};

export const getAllPlans = () => {
  return Object.values(APP_PLANS);
};

/**
 * Calcula los límites efectivos de CVs y puestos de trabajo basados en el plan actual del usuario
 * y un nuevo plan adquirido.
 * @param {object} currentPlan - El plan actual del usuario (puede ser null si no tiene plan).
 * @param {object} newPlan - El nuevo plan que el usuario ha adquirido.
 * @returns {object} Un objeto con los límites efectivos de cvLimit y jobLimit, y el plan actual efectivo.
 */
export const calculateEffectivePlan = (suscripcion) => {
  let effectiveCvLimit = 0;
  let effectiveJobLimit = 0;
  let effectiveCurrentPlan = null;
  let isSubscriptionActive = false;

  console.log("[DEBUG] calculateEffectivePlan - suscripcion:", suscripcion);

  if (!suscripcion || suscripcion.status !== 'active') {
    console.log("[DEBUG] calculateEffectivePlan - No active subscription found.");
    return {
      cvLimit: 0,
      jobLimit: 0,
      effectiveCurrentPlan: null,
      isSubscriptionActive: false,
      periodEndsAt: null,
    };
  }

  const now = new Date();
  const periodEndsAt = suscripcion.current_period_end ? new Date(suscripcion.current_period_end) : null;

  // Determinar si la suscripción está activa por fecha
  if (suscripcion.status === 'active' && (!periodEndsAt || periodEndsAt > now)) {
    isSubscriptionActive = true;
  } else {
    console.log("[DEBUG] calculateEffectivePlan - Subscription not active by date or status.");
    return {
      cvLimit: 0,
      jobLimit: 0,
      effectiveCurrentPlan: null,
      isSubscriptionActive: false,
      periodEndsAt: suscripcion.current_period_end,
    };
  }

  // Obtener el plan base de la suscripción
  const basePlan = APP_PLANS[suscripcion.plan_id];

  if (basePlan) {
    effectiveCurrentPlan = basePlan;

    // Si el plan base es mensual/enterprise, usar sus límites
    if (basePlan.type === 'monthly' || basePlan.type === 'enterprise') {
      effectiveCvLimit = basePlan.cvLimit || 0;
      effectiveJobLimit = basePlan.jobLimit || 0;
    } else if (basePlan.type === 'one-time') {
      // Si el plan base es puntual, sus límites base son 0, los límites vienen de los bonos
      effectiveCvLimit = 0;
      effectiveJobLimit = 0;
    }
  }

  // Sumar los bonos puntuales
  effectiveCvLimit += suscripcion.one_time_cv_bonus || 0;
  effectiveJobLimit += suscripcion.one_time_job_bonus || 0;

  console.log("[DEBUG] calculateEffectivePlan - Calculated effectiveCvLimit:", effectiveCvLimit);
  console.log("[DEBUG] calculateEffectivePlan - Calculated effectiveJobLimit:", effectiveJobLimit);
  console.log("[DEBUG] calculateEffectivePlan - Effective Current Plan:", effectiveCurrentPlan);
  console.log("[DEBUG] calculateEffectivePlan - Is Subscription Active:", isSubscriptionActive);
  console.log("[DEBUG] calculateEffectivePlan - Period Ends At:", periodEndsAt);

  return {
    cvLimit: effectiveCvLimit,
    jobLimit: effectiveJobLimit,
    effectiveCurrentPlan: effectiveCurrentPlan,
    isSubscriptionActive: isSubscriptionActive,
    periodEndsAt: suscripcion.current_period_end,
  };
};
