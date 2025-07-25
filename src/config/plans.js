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
let lastSuscripcion = null;
let lastCurrentJobCount = null;
let lastEffectivePlanResult = null;

export const calculateEffectivePlan = (suscripcion, currentJobCount = 0) => {
  // Convertir suscripcion a una cadena JSON para una comparación profunda simple
  const currentSuscripcionString = JSON.stringify(suscripcion);
  const lastSuscripcionString = JSON.stringify(lastSuscripcion);

  // Si los argumentos no han cambiado, devolver el resultado cacheado
  if (currentSuscripcionString === lastSuscripcionString && currentJobCount === lastCurrentJobCount) {
    console.debug("[DEBUG] calculateEffectivePlan - Devolviendo resultado cacheado.");
    return lastEffectivePlanResult;
  }

  console.debug("[DEBUG] calculateEffectivePlan - Recalculando plan efectivo debido a cambios en los inputs.");

  let effectiveCvLimit = 0;
  let effectiveJobLimit = 0;
  let effectiveMatchLimit = 0;
  let effectiveCurrentPlan = null;
  let isSubscriptionActive = false;
  let matchesUsed = 0; // Nueva variable para el contador de matches usados


  if (!suscripcion) {
    console.debug("[DEBUG] calculateEffectivePlan - No subscription object found.");
    const result = {
      cvLimit: 0,
      jobLimit: 0,
      matchLimit: 0,
      effectiveCurrentPlan: null,
      isSubscriptionActive: false,
      periodEndsAt: null,
    };
    lastSuscripcion = suscripcion;
    lastCurrentJobCount = currentJobCount;
    lastEffectivePlanResult = result;
    return result;
  }

  const now = new Date();
  let periodEndsAt = null; // Fecha de fin del período más relevante
  let activePlans = []; // Para almacenar los planes activos y sus límites

  console.debug("[DEBUG] calculateEffectivePlan - Suscripcion recibida:", suscripcion); // Nuevo log
  console.debug(`[DEBUG] calculateEffectivePlan - Fecha actual (now): ${now}`); // Nuevo log

  const basePlan = APP_PLANS[suscripcion.plan_id];
  let basePlanActive = false;

  // 1. Evaluar el plan base (mensual, empresarial, trial)
  if (basePlan && (basePlan.type === 'monthly' || basePlan.type === 'enterprise' || basePlan.type === 'trial')) {
    const subscriptionPeriodEndsAt = suscripcion.current_period_end ? new Date(suscripcion.current_period_end) : null;
    console.debug(`[DEBUG] Base Plan Check: plan_id=${suscripcion.plan_id}, status=${suscripcion.status}, current_period_end=${suscripcion.current_period_end}, subscriptionPeriodEndsAt=${subscriptionPeriodEndsAt}, now=${now}`);
    
    const isTrialActive = basePlan.type === 'trial' && suscripcion.status === 'trialing' && subscriptionPeriodEndsAt && subscriptionPeriodEndsAt > now;
    const isPaidPlanActive = (basePlan.type === 'monthly' || basePlan.type === 'enterprise') && suscripcion.status === 'active' && subscriptionPeriodEndsAt && subscriptionPeriodEndsAt > now;

    console.debug(`[DEBUG] calculateEffectivePlan - isTrialActive: ${isTrialActive}, isPaidPlanActive: ${isPaidPlanActive}`); // Nuevo log

    if (isTrialActive || isPaidPlanActive) {
      basePlanActive = true;
      activePlans.push({
        plan: basePlan,
        cvLimit: basePlan.cvLimit || 0,
        jobLimit: basePlan.jobLimit || 0,
        matchLimit: basePlan.matchLimit || 0,
        periodEndsAt: subscriptionPeriodEndsAt,
        type: basePlan.type
      });
      periodEndsAt = subscriptionPeriodEndsAt; // El plan mensual/trial define el período principal
      console.log(`[DEBUG] calculateEffectivePlan - Plan base '${basePlan.id}' activo.`);
    } else {
      console.log(`[DEBUG] calculateEffectivePlan - Suscripción mensual/empresarial/trial expirada o inactiva para plan ${suscripcion.plan_id}.`);
    }
  }

  // 2. Evaluar los bonos puntuales
  const bonusPeriodStart = suscripcion.bonus_periodo_start ? new Date(suscripcion.bonus_periodo_start) : null;
  const bonusPeriodEnd = suscripcion.bonus_periodo_end ? new Date(suscripcion.bonus_periodo_end) : null;
  let bonusPlanActive = false;

  console.debug(`[DEBUG] Bonus Plan Check: one_time_cv_bonus=${suscripcion.one_time_cv_bonus}, one_time_job_bonus=${suscripcion.one_time_job_bonus}, one_time_match_bonus=${suscripcion.one_time_match_bonus}`);
  console.debug(`[DEBUG] Bonus Dates: bonus_periodo_start=${suscripcion.bonus_periodo_start}, bonusPeriodStart=${bonusPeriodStart}, bonus_periodo_end=${suscripcion.bonus_periodo_end}, bonusPeriodEnd=${bonusPeriodEnd}, now=${now}`);

  // Verificar si los bonos puntuales están activos por fecha Y si no se han agotado
  const hasBonusLimits = (suscripcion.one_time_cv_bonus || 0) > 0 || (suscripcion.one_time_job_bonus || 0) > 0 || (suscripcion.one_time_match_bonus || 0) > 0;
  const hasConsumedBonusCv = (suscripcion.cvs_analizados_este_periodo || 0) >= (suscripcion.one_time_cv_bonus || 0);
  const hasConsumedBonusJobs = currentJobCount >= (suscripcion.one_time_job_bonus || 0); // Usar currentJobCount
  const hasConsumedBonusMatches = (suscripcion.one_time_match_bonus || 0) >= (suscripcion.one_time_cv_bonus || 0);

  console.debug(`[DEBUG] Bonus Consumption Check: hasConsumedBonusCv=${hasConsumedBonusCv}, hasConsumedBonusJobs=${hasConsumedBonusJobs}, hasConsumedBonusMatches=${hasConsumedBonusMatches}`);

  // Los bonos puntuales se consideran activos si tienen límites definidos Y no se han agotado,
  // Y si tienen fechas, que estén dentro del período. Si no tienen fechas, se asume que son válidos hasta su consumo.
  if (hasBonusLimits && (!hasConsumedBonusCv || !hasConsumedBonusJobs || !hasConsumedBonusMatches)) {
    if ((bonusPeriodStart && bonusPeriodEnd && now >= bonusPeriodStart && now <= bonusPeriodEnd) || (!bonusPeriodStart && !bonusPeriodEnd)) {
      bonusPlanActive = true;
      activePlans.push({
        plan: APP_PLANS['busqueda_puntual'], // Usar el plan de búsqueda puntual como referencia
        cvLimit: hasConsumedBonusCv ? 0 : (suscripcion.one_time_cv_bonus || 0),
        jobLimit: hasConsumedBonusJobs ? 0 : (suscripcion.one_time_job_bonus || 0),
        matchLimit: hasConsumedBonusMatches ? 0 : (suscripcion.one_time_cv_bonus || 0),
        periodEndsAt: bonusPeriodEnd, // Puede ser null, pero se usa para la visualización si existe
        type: 'one-time'
      });
      console.debug("[DEBUG] calculateEffectivePlan - Bonos puntuales activos y no agotados.");
    } else {
      console.debug("[DEBUG] calculateEffectivePlan - Bonos puntuales existen pero están expirados por fecha.");
    }
  } else if (hasBonusLimits) {
    console.debug("[DEBUG] calculateEffectivePlan - Bonos puntuales existen pero están agotados o sin fechas definidas.");
  }

  // 3. Sumar los límites de todos los planes activos
  activePlans.forEach(planInfo => {
    effectiveCvLimit += planInfo.cvLimit;
    effectiveJobLimit += planInfo.jobLimit;
    effectiveMatchLimit += planInfo.matchLimit;
  });

  // 4. Determinar el plan efectivo principal y la fecha de fin del período
  if (basePlanActive) {
    effectiveCurrentPlan = basePlan;
    // periodEndsAt ya se estableció con la fecha del plan base
  } else if (bonusPlanActive) {
    effectiveCurrentPlan = APP_PLANS['busqueda_puntual'];
    // Si el plan base no está activo, y el bono sí, la fecha de fin del bono es la relevante
    if (!basePlanActive) {
      periodEndsAt = bonusPeriodEnd;
    }
  } else {
    effectiveCurrentPlan = null;
    periodEndsAt = null;
  }

  // 5. Determinar si la suscripción general está activa
  isSubscriptionActive = basePlanActive || bonusPlanActive;


  // Determinar el contador de matches usados según el plan activo
  if (basePlanActive) {
    matchesUsed = suscripcion.mach_analizados_este_periodo || 0;
  } else if (bonusPlanActive) {
    matchesUsed = suscripcion.one_time_match_bonus || 0;
  }

  const result = {
    cvLimit: effectiveCvLimit,
    jobLimit: effectiveJobLimit,
    matchLimit: effectiveMatchLimit,
    cvs_used: suscripcion.cvs_analizados_este_periodo || 0, // Añadir
    jobs_used: currentJobCount, // Añadir
    matches_used: matchesUsed, // Añadir
    effectiveCurrentPlan: effectiveCurrentPlan,
    isSubscriptionActive: isSubscriptionActive,
    periodEndsAt: periodEndsAt,
    isBasePlanActive: basePlanActive,
    basePlan: basePlan,
  };

  // Guardar los argumentos y el resultado para futuras llamadas
  lastSuscripcion = suscripcion;
  lastCurrentJobCount = currentJobCount;
  lastEffectivePlanResult = result;

  return result;
};
