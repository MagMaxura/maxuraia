"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _stripe = _interopRequireDefault(require("stripe"));

var _plans = require("../_lib/plans.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// api/stripe/create-payment-intent.js
// Ruta corregida y consistente
// Verifica la clave secreta de Stripe al inicio.
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('FATAL_ERROR: STRIPE_SECRET_KEY no está configurada en las variables de entorno.'); // En un entorno de producción real, podrías querer que la función falle de forma más ruidosa
  // o tener un mecanismo de alerta si esto sucede.
} // Inicializa Stripe una vez. La instancia se reutilizará en las invocaciones de la función.


var stripe = new _stripe["default"](process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10' // Usa la versión de API más reciente o la que prefieras

});

var _callee = function _callee(req, res) {
  var _req$body, priceId, recruiterId, email, plan, amountInCents, customer, customers, paymentIntentParams, paymentIntent;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method !== 'POST')) {
            _context.next = 3;
            break;
          }

          res.setHeader('Allow', ['POST']);
          return _context.abrupt("return", res.status(405).json({
            error: {
              message: "Method ".concat(req.method, " Not Allowed")
            }
          }));

        case 3:
          _req$body = req.body, priceId = _req$body.priceId, recruiterId = _req$body.recruiterId, email = _req$body.email; // Validación de datos de entrada

          if (priceId) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: {
              message: 'priceId es requerido'
            }
          }));

        case 6:
          if (recruiterId) {
            _context.next = 8;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: {
              message: 'recruiterId es requerido'
            }
          }));

        case 8:
          if (email) {
            _context.next = 10;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: {
              message: 'email es requerido'
            }
          }));

        case 10:
          // Busca el plan en la configuración local
          plan = Object.values(_plans.APP_PLANS).find(function (p) {
            return p.stripePriceId === priceId;
          });

          if (plan) {
            _context.next = 14;
            break;
          }

          console.warn("Intento de creaci\xF3n de PaymentIntent para priceId no encontrado: ".concat(priceId));
          return _context.abrupt("return", res.status(404).json({
            error: {
              message: 'Plan no encontrado para el priceId proporcionado'
            }
          }));

        case 14:
          // El monto debe estar en la unidad más pequeña de la moneda (ej. centavos)
          amountInCents = plan.priceNumeric;

          if (!(typeof amountInCents !== 'number' || amountInCents <= 0)) {
            _context.next = 18;
            break;
          }

          console.error("Monto inv\xE1lido para el plan ".concat(plan.id, ": ").concat(amountInCents, ". Debe ser un n\xFAmero positivo."));
          return _context.abrupt("return", res.status(400).json({
            error: {
              message: 'Monto del plan inválido o no configurado.'
            }
          }));

        case 18:
          _context.prev = 18;
          _context.next = 21;
          return regeneratorRuntime.awrap(stripe.customers.list({
            email: email,
            limit: 1
          }));

        case 21:
          customers = _context.sent;

          if (!(customers.data.length > 0)) {
            _context.next = 27;
            break;
          }

          // Si existe, úsalo
          customer = customers.data[0];
          console.log("Cliente de Stripe encontrado: ".concat(customer.id));
          _context.next = 31;
          break;

        case 27:
          _context.next = 29;
          return regeneratorRuntime.awrap(stripe.customers.create({
            email: email,
            metadata: {
              recruiterId: String(recruiterId)
            } // Es bueno guardar el ID aquí también

          }));

        case 29:
          customer = _context.sent;
          console.log("Nuevo cliente de Stripe creado: ".concat(customer.id));

        case 31:
          // --- FIN DE LA MEJORA ---
          paymentIntentParams = {
            customer: customer.id,
            // Asociar el PaymentIntent al cliente de Stripe
            amount: amountInCents,
            currency: 'ars',
            // Asegúrate de que esta moneda esté activa en tu cuenta de Stripe
            metadata: {
              recruiterId: String(recruiterId),
              // Asegurar que el recruiterId se pase como metadata
              email: String(email),
              planId: String(plan.id),
              // ID interno de tu plan
              stripePriceId: String(priceId) // Price ID de Stripe usado

            },
            automatic_payment_methods: {
              enabled: true
            }
          };
          console.log('Creando PaymentIntent con params:', paymentIntentParams);
          _context.next = 35;
          return regeneratorRuntime.awrap(stripe.paymentIntents.create(paymentIntentParams));

        case 35:
          paymentIntent = _context.sent;
          console.log("PaymentIntent ".concat(paymentIntent.id, " creado exitosamente para recruiter ").concat(recruiterId));
          res.status(200).json({
            clientSecret: paymentIntent.client_secret
          });
          _context.next = 44;
          break;

        case 40:
          _context.prev = 40;
          _context.t0 = _context["catch"](18);
          console.error("Error al crear Stripe Payment Intent para recruiter ".concat(recruiterId, " con priceId ").concat(priceId, ":"), _context.t0); // Devuelve un error genérico pero loguea el detalle

          res.status(500).json({
            error: {
              message: _context.t0.message || 'Ocurrió un error al procesar el pago.'
            }
          });

        case 44:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[18, 40]]);
};

exports["default"] = _callee;