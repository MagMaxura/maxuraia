"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllPlans = exports.getPlanById = exports.PLAN_CV_ANALYSIS_LIMITS = exports.PLAN_HIERARCHY = exports.APP_PLANS = void 0;

/**
 * Define los planes de la aplicación y su mapeo con los IDs de producto y precio de Paddle.
 * ¡Verifica que paddlePriceId coincida con tu dashboard de Paddle!
 */
var APP_PLANS = {
  // Nuevo plan Trial
  trial: {
    id: 'trial',
    name: 'Plan de Prueba',
    stripeProductId: 'prod_XXXXXXX',
    // Reemplazar con ID de producto de Stripe real si aplica
    stripePriceId: 'price_XXXXXXX',
    // Reemplazar con ID de precio de Stripe real si aplica
    priceDisplay: 'Gratis',
    priceNumeric: 0,
    type: 'trial',
    periodicity: 'periodo de prueba',
    ctaLabel: 'Empezar Prueba',
    description: 'Prueba todas las funcionalidades básicas de Employ Smart IA por un tiempo limitado.',
    cvLimit: 10,
    // Ajustar según la definición real del plan trial
    jobLimit: 1,
    // Límite de 1 puesto activo para el plan trial
    features: ["Te damos la posibilidad de probar la mejor herramienta reclutamiento", "1 Puesto de trabajo activo", "Análisis de CVs: Hasta 10", // Ajustar según la definición real
    "Macheo de candidatos (match IA): Hasta 10 CVs", // Ajustar según la definición real
    "Redacción de publicaciones con IA", "Soporte: Email estándar"]
  },
  busqueda_puntual: {
    id: 'busqueda_puntual',
    name: 'Employ Smart IA - Búsqueda Puntual',
    // paddleProductId: 'pro_01jvsnq9yztcy6ycqhxmh82ahb', // Comentado para Stripe
    // paddlePriceId: 'pri_01jvsnrta15svqcgec4z0c948a', // Comentado para Stripe
    stripeProductId: 'prod_SOuIhd2wtVyKlt',
    // Product ID de Stripe para Búsqueda Puntual (Real)
    stripePriceId: 'price_1RU6U4A5iob5uvoTs9J8cvob',
    // Price ID de Stripe para Búsqueda Puntual (Real)
    //stripeProductId: 'prod_SP3ceC9zv6TSJO', // Product ID de Stripe para Búsqueda Puntual (Prueba)
    //stripePriceId: 'price_1RUFVEA5iob5uvoTOCXpgQtD', // Price ID de Stripe para Búsqueda Puntual (Prueba)
    priceDisplay: 'ARS 18,000.00',
    // Mantener display si es el mismo precio de prueba
    priceNumeric: 1800000,
    // Mantener numeric si es el mismo precio de prueba
    type: 'one-time',
    periodicity: 'único por puesto',
    ctaLabel: 'Empezar ahora',
    description: 'Ideal para emprendedores y pequeñas empresas con necesidades de reclutamiento específicas y puntuales.',
    cvLimit: 75,
    jobLimit: 1,
    // Añadido: Límite de puestos de trabajo activos
    features: ["1 Puesto de trabajo activo", "Análisis de CVs: Hasta 75", "Macheo de candidatos (match IA): Hasta 75 CVs", "Redacción de publicaciones con IA", "Preselección por IA: Manual", "Soporte: Email estándar"]
  },
  profesional_monthly: {
    id: 'profesional_monthly',
    name: 'Employ Smart IA - Plan Profesional',
    // paddleProductId: 'pro_01jvsmnsj3hhfnyt0y89rawyn4', // Comentado para Stripe
    // paddlePriceId: 'pri_01jvsn7rjbv61144k9ztfrscjr', // Comentado para Stripe
    stripeProductId: 'prod_SOuQ5ACG8YX7vu',
    // Product ID de Stripe para Plan Profesional (Real)
    stripePriceId: 'price_1RU6bpA5iob5uvoT2c5VkaIf',
    // Price ID de Stripe para Plan Profesional (Real)
    //stripeProductId: 'prod_SP3bTBrf7tFsyt', // Product ID de Stripe para Plan Profesional (Prueba)
    //stripePriceId: 'price_1RUFUfA5iob5uvoTwfgZtdfi', // Price ID de Stripe para Plan Profesional (Prueba)
    priceDisplay: 'ARS 12,500.00/month',
    // Mantener display si es el mismo precio de prueba
    priceNumeric: 1250000,
    // Mantener numeric si es el mismo precio de prueba
    type: 'monthly',
    ctaLabel: 'Comenzar ahora',
    description: 'Cuota mensual para usar la mejor herramienta de reclutamiento.',
    cvLimit: 100,
    jobLimit: 3,
    // Añadido: Límite de puestos de trabajo activos
    features: ["Hasta 3 Puestos de trabajo activos", "Análisis de CVs: Hasta 100/mes", "Macheo de candidatos (match IA): Hasta 100 CVs", "Redacción de publicaciones con IA", "Preselección por IA: Manual", "Soporte: Email estándar"]
  },
  empresa_monthly: {
    id: 'empresa_monthly',
    name: 'Employ Smart IA - Plan Business',
    // paddleProductId: 'pro_01jvsmjxcwypkdaxkcvas8q9mw', // Comentado para Stripe
    // paddlePriceId: 'pri_01jvsmm8vm50zz6q025w5sxkns', // Comentado para Stripe
    stripeProductId: 'prod_SOuKUAX4QG2rY5',
    // Product ID de Stripe para Plan Empresa
    stripePriceId: 'price_1RU6WHA5iob5uvoTNoQ7eIbl',
    // Price ID de Stripe para Plan Empresa
    priceDisplay: 'ARS 69,000.00/month',
    priceNumeric: 6900000,
    type: 'monthly',
    isRecommended: true,
    ctaLabel: 'Elegir Business',
    description: 'Automatizá tus procesos con IA y liberá a tu equipo de RRHH.',
    cvLimit: 1000,
    jobLimit: 25,
    // Añadido: Límite de puestos de trabajo activos
    features: ["Hasta 25 Puestos de trabajo activos", "Análisis de CVs: Hasta 1.000/mes", "Macheo de candidatos (match IA): Hasta 1.000 CVs", "Redacción de publicaciones con IA", "Preselección por IA: Avanzada con ranking", "Chatbot para entrevistas automatizadas", "Soporte: Prioritario", "Acceso a métricas e informes avanzados"]
  },
  enterprise_monthly: {
    id: 'enterprise_monthly',
    name: 'Employ Smart IA - Plan Enterprise',
    // paddleProductId: 'pro_01jvsnkm4n8ry8h3p1an42ytv2', // Comentado para Stripe
    // paddlePriceId: 'pri_01jvsnnm2gtv294yv4wz7ns21y', // Comentado para Stripe
    stripeProductId: 'prod_SOuKnG1aCIacRl',
    // Product ID de Stripe para Plan Enterprise
    stripePriceId: 'price_1RU6VeA5iob5uvoTV3yXvMVt',
    // Price ID de Stripe para Plan Enterprise
    priceDisplay: 'ARS 300,000.00/month',
    priceNumeric: 30000000,
    type: 'enterprise',
    ctaLabel: 'Solicitar demo',
    description: 'Solución integral y personalizada para grandes empresas con necesidades avanzadas de reclutamiento.',
    cvLimit: Infinity,
    jobLimit: Infinity,
    // Añadido: Límite de puestos de trabajo activos
    features: ["Puestos de trabajo activos: Ilimitados", "Análisis de CVs: Ilimitados", "Macheo de candidatos (match IA): Ilimitados", "Redacción de publicaciones con IA", "Preselección por IA: Avanzada con ranking y personalización de criterios", "Chatbot para entrevistas automatizadas: Con personalización avanzada de flujos", "Soporte: Dedicado 24/7 con Account Manager", "Personalización de la plataforma y reportes: Incluida", "Acceso a métricas e informes avanzados: Con consultoría y análisis personalizado", "Acceso anticipado a nuevas funcionalidades Beta"]
  }
};
exports.APP_PLANS = APP_PLANS;
var PLAN_HIERARCHY = {
  trial: {
    next: 'profesional_monthly',
    name: 'Profesional'
  },
  profesional_monthly: {
    next: 'empresa_monthly',
    name: 'Business'
  },
  empresa_monthly: {
    next: 'enterprise_monthly',
    name: 'Enterprise'
  },
  enterprise_monthly: null
};
exports.PLAN_HIERARCHY = PLAN_HIERARCHY;
var PLAN_CV_ANALYSIS_LIMITS = {
  trial: 10,
  busqueda_puntual: 75,
  profesional_monthly: 100,
  empresa_monthly: 1000,
  enterprise_monthly: Infinity,
  enterprise: Infinity
};
exports.PLAN_CV_ANALYSIS_LIMITS = PLAN_CV_ANALYSIS_LIMITS;

var getPlanById = function getPlanById(planId) {
  return APP_PLANS[planId];
};

exports.getPlanById = getPlanById;

var getAllPlans = function getAllPlans() {
  return Object.values(APP_PLANS);
};

exports.getAllPlans = getAllPlans;