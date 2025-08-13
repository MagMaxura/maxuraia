"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _supabaseJs = require("@supabase/supabase-js");

var _micro = require("micro");

// Inicializar Supabase para el entorno de backend
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase = (0, _supabaseJs.createClient)(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});
var _process$env = process.env,
    GOOGLE_CLIENT_ID = _process$env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET = _process$env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI = _process$env.GOOGLE_REDIRECT_URI; // Quitar la barra al final de la URI si existe

var redirectUriCleaned = GOOGLE_REDIRECT_URI.replace(/\/$/, '');
console.log('Backend Google Redirect URI (cleaned):', redirectUriCleaned); // CORRECCIÓN: Se eliminó encodeURIComponent

var oauth2Client = new _googleapis.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUriCleaned);

var _callee = function _callee(req, res) {
  var _req$body, code, userId, _ref, tokens, upsertData, _ref2, data, error, scopes, authorizationUrl;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'POST')) {
            _context.next = 34;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, code = _req$body.code, userId = _req$body.userId;
          console.log('Auth Request Body:', {
            code: code ? 'present' : 'missing',
            userId: userId
          });
          console.log('Received code:', code);
          console.log('Google Client ID:', GOOGLE_CLIENT_ID ? 'present' : 'missing');
          console.log('Google Client Secret:', GOOGLE_CLIENT_SECRET ? 'present' : 'missing');
          console.log('Google Redirect URI:', GOOGLE_REDIRECT_URI ? 'present' : 'missing');

          if (!(!code || !userId)) {
            _context.next = 10;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'Code and userId are required.'
          }));

        case 10:
          _context.next = 12;
          return regeneratorRuntime.awrap(oauth2Client.getToken(code));

        case 12:
          _ref = _context.sent;
          tokens = _ref.tokens;
          console.log('Google Tokens received:', tokens); // Preparar datos para upsert, incluyendo refresh_token solo si está presente

          upsertData = {
            user_id: userId,
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope
          }; // Solo añadir refresh_token si existe (se devuelve solo en la primera autorización)

          if (tokens.refresh_token) {
            upsertData.refresh_token = tokens.refresh_token;
          } // Almacenar tokens de refresco de forma segura en Supabase


          _context.next = 19;
          return regeneratorRuntime.awrap(supabase.from('user_google_tokens').upsert(upsertData, {
            onConflict: 'user_id'
          }));

        case 19:
          _ref2 = _context.sent;
          data = _ref2.data;
          error = _ref2.error;

          if (!error) {
            _context.next = 25;
            break;
          }

          console.error('Error storing tokens:', error);
          return _context.abrupt("return", (0, _micro.send)(res, 500, {
            error: 'Failed to store tokens.'
          }));

        case 25:
          // Devolver el access_token y el userId al frontend
          (0, _micro.send)(res, 200, {
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date,
            userId: userId
          });
          _context.next = 32;
          break;

        case 28:
          _context.prev = 28;
          _context.t0 = _context["catch"](1);
          console.error('Error during token exchange (full error object):', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to exchange code for tokens.',
            details: _context.t0.message
          });

        case 32:
          _context.next = 35;
          break;

        case 34:
          if (req.method === 'GET') {
            // Iniciar el flujo de autenticación de Google
            scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];
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

        case 35:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 28]]);
};

exports["default"] = _callee;