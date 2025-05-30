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
  var _req$body, priceId, recruiterId, email, plan, amountInCents, paymentIntentParams, paymentIntent;

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
          // Si la STRIPE_SECRET_KEY no estuviera configurada, la inicialización de `stripe` ya habría fallado
          // o la siguiente llamada fallaría. El `if (!stripe)` no es estrictamente necesario aquí si se confía
          // en que la inicialización global de Stripe se maneja correctamente o lanza errores.
          paymentIntentParams = {
            amount: amountInCents,
            currency: 'ars',
            // Asegúrate de que esta moneda esté activa en tu cuenta de Stripe
            metadata: {
              recruiterId: String(recruiterId),
              // Es buena práctica asegurar que los IDs en metadata sean strings
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
          _context.next = 23;
          return regeneratorRuntime.awrap(stripe.paymentIntents.create(paymentIntentParams));

        case 23:
          paymentIntent = _context.sent;
          console.log("PaymentIntent ".concat(paymentIntent.id, " creado exitosamente para recruiter ").concat(recruiterId));
          res.status(200).json({
            clientSecret: paymentIntent.client_secret
          });
          _context.next = 32;
          break;

        case 28:
          _context.prev = 28;
          _context.t0 = _context["catch"](18);
          console.error("Error al crear Stripe Payment Intent para recruiter ".concat(recruiterId, " con priceId ").concat(priceId, ":"), _context.t0); // Devuelve un error genérico pero loguea el detalle

          res.status(500).json({
            error: {
              message: _context.t0.message || 'Ocurrió un error al procesar el pago.'
            }
          });

        case 32:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[18, 28]]);
};

exports["default"] = _callee;