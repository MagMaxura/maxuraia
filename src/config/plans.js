// src/config/plans.js

/**
 * Define los planes de la aplicación y su mapeo con los IDs de producto y precio de Paddle.
 */
export const APP_PLANS = {
  profesional_monthly: {
    id: 'profesional_monthly', // Identificador interno de tu plan
    name: 'Employ Smart IA - Plan Profesional',
    paddleProductId: 'pro_01jv7ztgg7vfkfbdnqvfqddj3r', // ID del Producto en Paddle
    paddlePriceId: 'pri_01jv7zzdtmfbvyref417p27tdv',   // ID del Precio en Paddle
    priceDisplay: 'ARS 12,500.00/month',
    description: 'Cuota mensual de usar la mejor herramienta para reclutamiento.',
    features: [
      "Hasta 3 Puestos de trabajo activos",
      "Análisis de CVs: Hasta 50/mes",
      "Macheo de candidatos (match IA): Hasta 50 CVs",
      "Redacción de publicaciones con IA",
      "Preselección por IA: Manual",
      "Soporte: Email estándar",
    ],
  },
  empresa_monthly: {
    id: 'empresa_monthly',
    name: 'Employ Smart IA - Plan Business', // O "Plan Empresa"
    paddleProductId: 'pro_01jv80cx5wsrdx08f6t7z7qndj', // ID del Producto en Paddle
    paddlePriceId: 'pri_01jv80fpjkjsxt5x278zn93mbt',   // ID del Precio en Paddle
    priceDisplay: 'ARS 69,000.00/month',
    description: 'Cuota mensual de usar la mejor herramienta para reclutamiento.',
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
      "Capacitación a equipos de RRHH: Opcional",
    ],
  },
  // Si tienes planes anuales, puedes definirlos aquí de manera similar,
  // asegurándote de usar los IDs de Producto y Precio correctos de Paddle.
  // Ejemplo:
  // profesional_yearly: {
  //   id: 'profesional_yearly',
  //   name: 'Employ Smart IA - Plan Profesional (Anual)',
  //   paddleProductId: 'pro_ID_PRODUCTO_ANUAL_PROFESIONAL',
  //   paddlePriceId: 'pri_ID_PRECIO_ANUAL_PROFESIONAL',
  //   priceDisplay: 'ARS XXXXX/año',
  //   description: 'Cuota anual con descuento.',
  //   features: ['Característica Profesional 1', 'Característica Profesional 2'],
  // },
};
// Límites de análisis de CV para la lógica de carga de CVs
// Estos valores deben estar sincronizados con las 'features' de APP_PLANS
// y considerar los fallbacks o planes por defecto usados en la aplicación.
export const PLAN_CV_ANALYSIS_LIMITS = {
  trial: 10,        // Límite para el período de prueba
  basico: 50,       // Límite para el plan básico (usado como fallback en Dashboard)
  profesional_monthly: 50,
  empresa_monthly: 1000,
  enterprise: Infinity, // Para planes sin límite definido o personalizados
};

/**
 * Función para obtener un plan por su ID interno.
 * @param {string} planId El ID interno del plan (ej. 'profesional_monthly').
 * @returns {object | undefined} El objeto del plan o undefined si no se encuentra.
 */
export const getPlanById = (planId) => {
  return APP_PLANS[planId];
};

/**
 * Devuelve un array con todos los planes disponibles.
 * @returns {Array<object>}
 */
export const getAllPlans = () => {
  return Object.values(APP_PLANS);
};