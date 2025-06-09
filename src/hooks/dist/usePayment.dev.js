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
              _context.next = 10;
              break;
            }

            console.error('usePayment: Información del usuario incompleta (ID o email faltante).');
            toast({
              title: "Error de Usuario",
              description: 'Se requiere información de usuario (ID y email) para el pago.',
              variant: "destructive"
            });
            setLoadingCheckout(false); // Asegurarse de desactivar el loading si la validación falla

            return _context.abrupt("return");

          case 10:
            setLoadingCheckout(true);
            console.log('usePayment - Iniciando checkout para stripePriceId:', planDetails.stripePriceId, 'Usuario Email:', user.email);
            _context.prev = 12;
            payload = {
              priceId: planDetails.stripePriceId,
              // Usar el ID de precio de Stripe
              recruiterId: user.id,
              // Se usará como recruiter_id en custom_data en el backend
              email: user.email,
              successUrl: dynamicUrls.successUrl,
              // Opcional, el backend tiene un fallback
              cancelUrl: dynamicUrls.cancelUrl // Opcional, el backend puede tener un fallback

            }; // Eliminar URLs si no se proporcionaron para usar los defaults del backend

            if (!payload.successUrl) delete payload.successUrl;
            if (!payload.cancelUrl) delete payload.cancelUrl;
            _context.next = 18;
            return regeneratorRuntime.awrap(fetch('/api/stripe/create-payment-intent', {
              // Usando endpoint de Stripe Payment Intent
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            }));

          case 18:
            response = _context.sent;
            _context.next = 21;
            return regeneratorRuntime.awrap(response.json());

          case 21:
            data = _context.sent;

            if (response.ok) {
              _context.next = 27;
              break;
            }

            console.error('usePayment - Error del API create-payment-intent:', data);
            toast({
              title: "Error al Iniciar Pago",
              description: data.message || data.error || 'No se pudo iniciar el proceso de pago. Intenta de nuevo.',
              variant: "destructive"
            });
            setLoadingCheckout(false);
            return _context.abrupt("return");

          case 27:
            // Si la respuesta es exitosa, esperamos un clientSecret
            if (data.clientSecret) {
              console.log('usePayment - Payment Intent clientSecret recibido.'); // Aquí deberías integrar la lógica de Stripe Elements para confirmar el pago
              // Esto probablemente implica usar stripe.js y los Elements montados en tu UI.
              // Por ahora, solo logueamos el éxito y el clientSecret.
              // La confirmación del pago con Elements ocurriría DESPUÉS de recibir este clientSecret.
              // Ejemplo conceptual (requiere la instancia de Stripe Elements):
              // const stripe = useStripe(); // Asumiendo que tienes un hook para obtener la instancia de Stripe
              // const elements = useElements(); // Asumiendo que tienes un hook para obtener la instancia de Elements
              // const cardElement = elements.getElement(CardElement); // O el Element que estés usando
              // const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(data.clientSecret, {
              //   payment_method: {
              //     card: cardElement,
              //     billing_details: {
              //       email: user.email,
              //     },
              //   },
              // });
              // if (confirmError) {
              //   console.error('usePayment - Error confirming payment:', confirmError);
              //   toast({ title: "Error en el Pago", description: confirmError.message, variant: "destructive" });
              // } else if (paymentIntent.status === 'succeeded') {
              //   console.log('usePayment - Pago exitoso:', paymentIntent);
              //   toast({ title: "Pago Exitoso", description: "Tu pago ha sido procesado.", variant: "success" });
              //   // Redirigir o actualizar UI tras pago exitoso
              //   // window.location.href = dynamicUrls.successUrl || '/payment-success';
              // }
              // Como no tengo acceso directo a la implementación de Stripe Elements aquí,
              // simplemente indicaré que el clientSecret fue recibido y la siguiente etapa
              // (confirmación del pago con Elements) debería ocurrir ahora.

              toast({
                title: "Proceso de Pago Iniciado",
                description: "Continúa en el formulario de pago.",
                variant: "success"
              });
            } else {
              console.error('usePayment - No se recibió clientSecret del API.');
              toast({
                title: "Error Inesperado",
                description: 'No se pudo obtener la información de pago del servidor.',
                variant: "destructive"
              });
            }

            _context.next = 34;
            break;

          case 30:
            _context.prev = 30;
            _context.t0 = _context["catch"](12);
            console.error('usePayment - Excepción al llamar a create-payment-intent:', _context.t0);
            toast({
              title: "Error de Red",
              description: 'Ocurrió un problema al iniciar el pago. Revisa tu conexión.',
              variant: "destructive"
            });

          case 34:
            _context.prev = 34;
            setLoadingCheckout(false); // Asegurarse de que loading se desactive

            return _context.finish(34);

          case 37:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[12, 30, 34, 37]]);
  };

  return {
    loadingCheckout: loadingCheckout,
    handleCheckout: handleCheckout
  };
};

exports.usePayment = usePayment;