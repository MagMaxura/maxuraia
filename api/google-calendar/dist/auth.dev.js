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
  var _req$body, code, userId, _ref, tokens, _ref2, data, error, scopes, authorizationUrl;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'POST')) {
            _context.next = 30;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, code = _req$body.code, userId = _req$body.userId;
          console.log('Auth Request Body:', {
            code: code ? 'present' : 'missing',
            userId: userId
          });
          console.log('Google Client ID:', GOOGLE_CLIENT_ID ? 'present' : 'missing');
          console.log('Google Client Secret:', GOOGLE_CLIENT_SECRET ? 'present' : 'missing');
          console.log('Google Redirect URI:', GOOGLE_REDIRECT_URI ? 'present' : 'missing');

          if (!(!code || !userId)) {
            _context.next = 9;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'Code and userId are required.'
          }));

        case 9:
          _context.next = 11;
          return regeneratorRuntime.awrap(oauth2Client.getToken(code));

        case 11:
          _ref = _context.sent;
          tokens = _ref.tokens;
          _context.next = 15;
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

        case 15:
          _ref2 = _context.sent;
          data = _ref2.data;
          error = _ref2.error;

          if (!error) {
            _context.next = 21;
            break;
          }

          console.error('Error storing tokens:', error);
          return _context.abrupt("return", (0, _micro.send)(res, 500, {
            error: 'Failed to store tokens.'
          }));

        case 21:
          // Devolver el access_token y el userId al frontend
          (0, _micro.send)(res, 200, {
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date,
            userId: userId
          });
          _context.next = 28;
          break;

        case 24:
          _context.prev = 24;
          _context.t0 = _context["catch"](1);
          console.error('Error during token exchange:', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to exchange code for tokens.',
            details: _context.t0.message
          });

        case 28:
          _context.next = 31;
          break;

        case 30:
          if (req.method === 'GET') {
            // Iniciar el flujo de autenticación de Google
            scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/drive.file', // O 'https://www.googleapis.com/auth/drive' para acceso completo
            'https://www.googleapis.com/auth/userinfo.email', // Para obtener el email del usuario
            'https://www.googleapis.com/auth/userinfo.profile' // Para obtener el perfil del usuario
            ];
            authorizationUrl = oauth2Client.generateAuthUrl({
              access_type: 'offline',
              // Esto asegura que obtengamos un refresh_token
              scope: scopes.join(' '),
              prompt: 'consent' // Solicita el consentimiento cada vez para asegurar el refresh_token

            });
            (0, _micro.send)(res, 302, null, {
              Location: authorizationUrl
            }); // Redirigir al usuario a la URL de autorización
          } else {
            (0, _micro.send)(res, 405, {
              error: 'Method Not Allowed'
            });
          }

        case 31:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 24]]);
};

exports["default"] = _callee;