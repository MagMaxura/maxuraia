"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePayment = void 0;

var _react = require("react");

var _useToast2 = require("@/components/ui/use-toast");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// Asegúrate que la ruta sea correcta
var usePayment = function usePayment() {
  var _useState = (0, _react.useState)(false),
      _useState2 = _slicedToArray(_useState, 2),
      loadingCheckout = _useState2[0],
      setLoadingCheckout = _useState2[1];

  var _useToast = (0, _useToast2.useToast)(),
      toast = _useToast.toast;

  var handleCheckout = function handleCheckout(planDetails, user) {
    var dynamicUrls,
        payload,
        response,
        data,
        _args = arguments;
    return regeneratorRuntime.async(function handleCheckout$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dynamicUrls = _args.length > 2 && _args[2] !== undefined ? _args[2] : {};

            if (!(!planDetails || !planDetails.stripePriceId)) {
              _context.next = 5;
              break;
            }

            console.error('usePayment: planDetails.stripePriceId no está definido.');
            toast({
              title: "Error de Configuración",
              description: 'Información del plan no disponible.',
              variant: "destructive"
            });
            return _context.abrupt("return");

          case 5:
            if (!(!user || !user.id || !user.email)) {
              _context.next = 9;
              break;
            }

            console.error('usePayment: Información del usuario incompleta.');
            toast({
              title: "Error de Usuario",
              description: 'Se requiere información de usuario para el pago.',
              variant: "destructive"
            });
            return _context.abrupt("return");

          case 9:
            setLoadingCheckout(true);
            console.log('usePayment - Iniciando checkout para priceId:', planDetails.paddlePriceId, 'Usuario Email:', user.email);
            _context.prev = 11;
            payload = {
              priceId: planDetails.paddlePriceId,
              userId: user.id,
              // Se usará como recruiter_id en custom_data en el backend
              userEmail: user.email,
              successUrl: dynamicUrls.successUrl,
              // Opcional, el backend tiene un fallback
              cancelUrl: dynamicUrls.cancelUrl // Opcional, el backend puede tener un fallback

            }; // Eliminar URLs si no se proporcionaron para usar los defaults del backend

            if (!payload.successUrl) delete payload.successUrl;
            if (!payload.cancelUrl) delete payload.cancelUrl;
            _context.next = 17;
            return regeneratorRuntime.awrap(fetch('/api/stripe/create-checkout-session', {
              // Usando endpoint de Stripe
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            }));

          case 17:
            response = _context.sent;
            _context.next = 20;
            return regeneratorRuntime.awrap(response.json());

          case 20:
            data = _context.sent;

            if (response.ok) {
              _context.next = 26;
              break;
            }

            console.error('usePayment - Error del API generate-pay-link:', data);
            toast({
              title: "Error al Iniciar Pago",
              description: data.message || data.errorDetails || 'No se pudo generar el enlace de pago. Intenta de nuevo.',
              variant: "destructive"
            });
            setLoadingCheckout(false);
            return _context.abrupt("return");

          case 26:
            if (data.checkoutUrl) {
              console.log('usePayment - Checkout URL recibida, redirigiendo:', data.checkoutUrl);
              window.location.href = data.checkoutUrl; // setLoadingCheckout(false) no es necesario aquí debido a la redirección
            } else {
              console.error('usePayment - No se recibió checkoutUrl del API.');
              toast({
                title: "Error Inesperado",
                description: 'No se pudo obtener el enlace de pago del servidor.',
                variant: "destructive"
              });
              setLoadingCheckout(false);
            }

            _context.next = 34;
            break;

          case 29:
            _context.prev = 29;
            _context.t0 = _context["catch"](11);
            console.error('usePayment - Excepción al llamar a generate-pay-link:', _context.t0);
            toast({
              title: "Error de Red",
              description: 'Ocurrió un problema al generar el pago. Revisa tu conexión.',
              variant: "destructive"
            });
            setLoadingCheckout(false);

          case 34:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[11, 29]]);
  };

  return {
    loadingCheckout: loadingCheckout,
    handleCheckout: handleCheckout
  };
};

exports.usePayment = usePayment;