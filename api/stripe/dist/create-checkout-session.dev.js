"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _stripe = _interopRequireDefault(require("stripe"));

var _plans = require("../_lib/plans.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Importar APP_PLANS
// Asegúrate de tener tu clave secreta de Stripe en las variables de entorno
var stripe = new _stripe["default"](process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10' // Usa la versión de API más reciente o la que prefieras

});

var _callee = function _callee(req, res) {
  var _req$body, priceId, recruiterId, email, plan, session;

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
          // Busca el plan en la configuración local
          plan = Object.values(_plans.APP_PLANS).find(function (p) {
            return p.stripePriceId === priceId;
          });

          if (plan) {
            _context.next = 10;
            break;
          }

          console.warn("Intento de creaci\xF3n de Checkout Session para priceId no encontrado: ".concat(priceId));
          return _context.abrupt("return", res.status(404).json({
            error: {
              message: 'Plan no encontrado para el priceId proporcionado'
            }
          }));

        case 10:
          _context.prev = 10;
          _context.next = 13;
          return regeneratorRuntime.awrap(stripe.checkout.sessions.create(_objectSpread({
            line_items: [{
              price: priceId,
              quantity: 1
            }],
            mode: plan.type === 'one-time' ? 'payment' : 'subscription',
            // Determina el modo basado en el tipo de plan
            success_url: "".concat(req.headers.origin, "/payment-success?session_id={CHECKOUT_SESSION_ID}"),
            cancel_url: "".concat(req.headers.origin, "/payment-cancelled"),
            metadata: {
              recruiterId: String(recruiterId),
              email: String(email),
              planId: String(plan.id),
              // ID interno de tu plan
              stripePriceId: String(priceId) // Price ID de Stripe usado

            },
            customer_email: email
          }, plan.type !== 'one-time' && {
            subscription_data: {
              metadata: {
                recruiterId: String(recruiterId),
                planId: String(plan.id)
              }
            }
          })));

        case 13:
          session = _context.sent;
          res.status(200).json({
            checkoutUrl: session.url
          });
          _context.next = 21;
          break;

        case 17:
          _context.prev = 17;
          _context.t0 = _context["catch"](10);
          console.error('Error creating Stripe checkout session:', _context.t0);
          res.status(500).json({
            error: _context.t0.message
          });

        case 21:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[10, 17]]);
};

exports["default"] = _callee;