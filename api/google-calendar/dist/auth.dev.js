"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _supabaseJs = require("@supabase/supabase-js");

var _micro = require("micro");

// Importar createClient
// Inicializar Supabase para el entorno de backend
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // O SUPABASE_SERVICE_ROLE_KEY si necesitas privilegios elevados

var supabase = (0, _supabaseJs.createClient)(supabaseUrl, supabaseKey);
var _process$env = process.env,
    GOOGLE_CLIENT_ID = _process$env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET = _process$env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI = _process$env.GOOGLE_REDIRECT_URI;
var oauth2Client = new _googleapis.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

var _callee = function _callee(req, res) {
  var _req$body, code, userId, _ref, tokens, _ref2, data, error;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'POST')) {
            _context.next = 26;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, code = _req$body.code, userId = _req$body.userId;

          if (!(!code || !userId)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'Code and userId are required.'
          }));

        case 5:
          _context.next = 7;
          return regeneratorRuntime.awrap(oauth2Client.getToken(code));

        case 7:
          _ref = _context.sent;
          tokens = _ref.tokens;
          _context.next = 11;
          return regeneratorRuntime.awrap(supabase.from('user_google_tokens') // Tabla para almacenar tokens de Google por usuario
          .upsert({
            user_id: userId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            // Solo se devuelve la primera vez
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope
          }, {
            onConflict: 'user_id'
          }));

        case 11:
          _ref2 = _context.sent;
          data = _ref2.data;
          error = _ref2.error;

          if (!error) {
            _context.next = 17;
            break;
          }

          console.error('Error storing tokens:', error);
          return _context.abrupt("return", (0, _micro.send)(res, 500, {
            error: 'Failed to store tokens.'
          }));

        case 17:
          // Devolver solo el access_token al frontend
          (0, _micro.send)(res, 200, {
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date
          });
          _context.next = 24;
          break;

        case 20:
          _context.prev = 20;
          _context.t0 = _context["catch"](1);
          console.error('Error during token exchange:', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to exchange code for tokens.',
            details: _context.t0.message
          });

        case 24:
          _context.next = 27;
          break;

        case 26:
          if (req.method === 'GET') {
            // Manejar el refresco de tokens o la obtención de eventos
            // Esto es un placeholder, la lógica real de eventos se manejará en otro endpoint
            // o se expandirá aquí. Por ahora, solo se enfoca en la autenticación.
            (0, _micro.send)(res, 405, {
              error: 'Method Not Allowed'
            });
          } else {
            (0, _micro.send)(res, 405, {
              error: 'Method Not Allowed'
            });
          }

        case 27:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 20]]);
};

exports["default"] = _callee;