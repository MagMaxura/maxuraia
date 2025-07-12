"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _stripe = _interopRequireDefault(require("stripe"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// api/stripe/retrieve-subscription.js
// Inicializa Stripe
var stripe = new _stripe["default"](process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10'
});

var _callee = function _callee(req, res) {
  var subscriptionId, subscription;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method !== 'GET')) {
            _context.next = 3;
            break;
          }

          res.setHeader('Allow', ['GET']);
          return _context.abrupt("return", res.status(405).json({
            error: {
              message: "Method ".concat(req.method, " Not Allowed")
            }
          }));

        case 3:
          subscriptionId = req.query.subscriptionId;

          if (subscriptionId) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: {
              message: 'subscriptionId es requerido.'
            }
          }));

        case 6:
          _context.prev = 6;
          _context.next = 9;
          return regeneratorRuntime.awrap(stripe.subscriptions.retrieve(subscriptionId));

        case 9:
          subscription = _context.sent;
          res.status(200).json({
            subscription: subscription
          });
          _context.next = 17;
          break;

        case 13:
          _context.prev = 13;
          _context.t0 = _context["catch"](6);
          console.error("Error al recuperar la suscripci\xF3n ".concat(subscriptionId, ":"), _context.t0);
          res.status(500).json({
            error: {
              message: _context.t0.message || 'Ocurrió un error al recuperar la suscripción.'
            }
          });

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[6, 13]]);
};

exports["default"] = _callee;