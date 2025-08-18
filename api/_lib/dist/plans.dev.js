"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllPlans = exports.getPlanById = exports.PLAN_CV_ANALYSIS_LIMITS = exports.APP_PLANS = void 0;

/**

 */
var APP_PLANS = {
  // Nuevo plan Trial
  trial: {
    id: 'trial',
    name: 'Plan de Prueba',
    stripeProductId: process.env.VITE_STRIPE_MODE === 'test' ? 'prod_YOUR_TRIAL_TEST_PRODUCT_ID' : 'prod_XXXXXXX',
    // Reemplazar con ID de producto de Stripe real si aplica
    stripePriceId: process.env.VITE_STRIPE_MODE === 'test' ? 'price_YOUR_TRIAL_TEST_PRICE_ID' : 'price_XXXXXXX',
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
    stripeProductId: process.env.VITE_STRIPE_MODE === 'test' ? 'prod_SP3ceC9zv6TSJO' : 'prod_SOuIhd2wtVyKlt',
    // Product ID de Stripe para Búsqueda Puntual
    stripePriceId: process.env.VITE_STRIPE_MODE === 'test' ? 'price_1RUFVEA5iob5uvoTOCXpgQtD' : 'price_1RU6U4A5iob5uvoTs9J8cvob',
    // Price ID de Stripe para Búsqueda Puntual
    priceDisplay: 'US$ 25.00',
    priceNumeric: 2500,
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
    stripeProductId: process.env.VITE_STRIPE_MODE === 'test' ? 'prod_SP3bTBrf7tFsyt' : 'prod_SOuQ5ACG8YX7vu',
    // Product ID de Stripe para Plan Profesional
    stripePriceId: process.env.VITE_STRIPE_MODE === 'test' ? 'price_1RUFUfA5iob5uvoTwfgZtdfi' : 'price_1RU6bpA5iob5uvoT2c5VkaIf',
    // Price ID de Stripe para Plan Profesional
    priceDisplay: 'US$ 18.00/mes',
    priceNumeric: 1800,
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
    stripeProductId: process.env.VITE_STRIPE_MODE === 'test' ? 'prod_SUd4buH7r8OzBI' : 'prod_SOuKUAX4QG2rY5',
    // Product ID de Stripe para Plan Empresa
    stripePriceId: process.env.VITE_STRIPE_MODE === 'test' ? 'price_1RZdoQA5iob5uvoTH6v1iswz' : 'price_1RU6WHA5iob5uvoTNoQ7eIbl',
    // Price ID de Stripe para Plan Empresa
    priceDisplay: 'US$ 69.00/mes',
    priceNumeric: 6900,
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
    stripeProductId: process.env.VITE_STRIPE_MODE === 'test' ? 'prod_SUdC0wywP6bPA2' : 'prod_SOuKnG1aCIacRl',
    // Product ID de Stripe para Plan Enterprise
    stripePriceId: process.env.VITE_STRIPE_MODE === 'test' ? 'price_1RZdvgA5iob5uvoTxTOhJ0ln' : 'price_1RU6VeA5iob5uvoTV3yXvMVt',
    // Price ID de Stripe para Plan Enterprise
    priceDisplay: 'US$ 1,000.00/mes',
    priceNumeric: 100000,
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
var PLAN_CV_ANALYSIS_LIMITS = {
  trial: 10,
  basico: 50,
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