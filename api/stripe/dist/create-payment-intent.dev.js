"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _stripe = _interopRequireDefault(require("stripe"));

var _plans = require("../../api/_lib/plans");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Importa tus planes para obtener el precio (ruta ajustada para Vercel)
// Asegúrate de tener tu clave secreta de Stripe en las variables de entorno
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY no está configurada en las variables de entorno.'); // Podrías lanzar un error aquí o manejarlo de otra manera si prefieres
}

var stripe = new _stripe["default"](process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10' // Usa la versión de API más reciente o la que prefieras

});

var _callee = function _callee(req, res) {
  var _req$body, priceId, recruiterId, email, plan, amountInCents, paymentIntent;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method !== 'POST')) {
            _context.next = 3;
            break;
          }

          res.setHeader('Allow', ['POST']);
          return _context.abrupt("return", res.status(405).end("Method ".concat(req.method, " Not Allowed")));

        case 3:
          _req$body = req.body, priceId = _req$body.priceId, recruiterId = _req$body.recruiterId, email = _req$body.email;

          if (priceId) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: 'priceId es requerido'
          }));

        case 6:
          // Busca el plan en tu configuración local para obtener el precio numérico
          // NOTA: En un entorno de producción real, deberías obtener el precio
          // directamente desde Stripe usando el priceId para evitar manipulaciones
          // en el frontend. Sin embargo, para este ejemplo, lo obtenemos de APP_PLANS.
          plan = Object.values(_plans.APP_PLANS).find(function (p) {
            return p.stripePriceId === priceId;
          });

          if (plan) {
            _context.next = 9;
            break;
          }

          return _context.abrupt("return", res.status(404).json({
            error: 'Plan no encontrado para el priceId proporcionado'
          }));

        case 9:
          // El monto debe estar en la unidad más pequeña de la moneda (ej. centavos para ARS)
          // Asegúrate de que priceNumeric en APP_PLANS sea el monto correcto en centavos
          amountInCents = plan.priceNumeric; // Asumiendo que priceNumeric ya está en centavos

          _context.prev = 10;

          if (stripe) {
            _context.next = 13;
            break;
          }

          throw new Error('Stripe no se inicializó correctamente. Verifica STRIPE_SECRET_KEY.');

        case 13:
          _context.next = 15;
          return regeneratorRuntime.awrap(stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'ars',
            // Asegúrate de que la moneda sea correcta
            metadata: {
              recruiterId: recruiterId,
              email: email,
              planId: plan.id // Guarda el ID de tu plan interno también

            } // Opcional: agregar customer si ya tienes uno en Stripe
            // customer: 'cus_...',
            // Opcional: agregar setup_future_usage si es una suscripción
            // setup_future_usage: 'off_session',

          }));

        case 15:
          paymentIntent = _context.sent;
          res.status(200).json({
            clientSecret: paymentIntent.client_secret
          });
          _context.next = 23;
          break;

        case 19:
          _context.prev = 19;
          _context.t0 = _context["catch"](10);
          console.error('Error creating Stripe Payment Intent:', _context.t0);
          res.status(500).json({
            error: _context.t0.message
          });

        case 23:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[10, 19]]);
};

exports["default"] = _callee;