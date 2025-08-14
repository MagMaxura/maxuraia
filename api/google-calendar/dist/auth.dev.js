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
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar la Service Role Key para el backend

var supabase = (0, _supabaseJs.createClient)(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});
var _process$env = process.env,
    GOOGLE_CLIENT_ID = _process$env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET = _process$env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI = _process$env.GOOGLE_REDIRECT_URI;
var oauth2Client = new _googleapis.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

var _callee = function _callee(req, res) {
  var _req$query, code, error, state, redirectUrl, _ref, tokens, userId, upsertData, _ref2, data, supabaseError, _redirectUrl2, _redirectUrl, _redirectUrl3, scopes, authorizationUrl;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'GET')) {
            _context.next = 49;
            break;
          }

          _req$query = req.query, code = _req$query.code, error = _req$query.error, state = _req$query.state; // 'state' puede contener el userId u otra información

          if (!error) {
            _context.next = 6;
            break;
          }

          console.error('Google OAuth error:', error); // Redirigir al frontend con un mensaje de error usando JavaScript

          redirectUrl = "/dashboard/calendario?googleAuth=error&message=".concat(encodeURIComponent(error));
          return _context.abrupt("return", (0, _micro.send)(res, 200, "\n        <!DOCTYPE html>\n        <html>\n        <head>\n          <title>Error de Redirecci\xF3n</title>\n          <script>\n            window.location.href = \"".concat(redirectUrl, "\";\n          </script>\n        </head>\n        <body>\n          <p>Ocurri\xF3 un error. Redirigiendo...</p>\n        </body>\n        </html>\n      ")));

        case 6:
          if (!code) {
            _context.next = 42;
            break;
          }

          _context.prev = 7;
          _context.next = 10;
          return regeneratorRuntime.awrap(oauth2Client.getToken(code));

        case 10:
          _ref = _context.sent;
          tokens = _ref.tokens;
          console.log('Tokens received from Google:', tokens);
          userId = state; // Asumiendo que el userId se pasa en el 'state'

          if (!userId) {
            _context.next = 30;
            break;
          }

          upsertData = {
            user_id: userId,
            access_token: tokens.access_token,
            expiry_date: new Date(tokens.expiry_date).toISOString(),
            token_type: tokens.token_type,
            scope: tokens.scope
          };

          if (tokens.refresh_token) {
            upsertData.refresh_token = tokens.refresh_token;
          }

          console.log('Attempting to upsert data to Supabase:', upsertData);
          _context.next = 20;
          return regeneratorRuntime.awrap(supabase.from('user_google_tokens').upsert(upsertData, {
            onConflict: 'user_id'
          }));

        case 20:
          _ref2 = _context.sent;
          data = _ref2.data;
          supabaseError = _ref2.error;

          if (!supabaseError) {
            _context.next = 27;
            break;
          }

          console.error('Error storing tokens in Supabase:', supabaseError);
          _redirectUrl2 = "/dashboard/calendario?googleAuth=error&message=".concat(encodeURIComponent(supabaseError.message));
          return _context.abrupt("return", (0, _micro.send)(res, 200, "\n              <!DOCTYPE html>\n              <html>\n              <head>\n                <title>Error de Redirecci\xF3n</title>\n                <script>\n                  window.location.href = \"".concat(_redirectUrl2, "\";\n                </script>\n              </head>\n              <body>\n                <p>Ocurri\xF3 un error. Redirigiendo...</p>\n              </body>\n              </html>\n            ")));

        case 27:
          console.log('Tokens successfully stored in Supabase:', data);
          _context.next = 31;
          break;

        case 30:
          console.warn('No userId found in state. Tokens not stored in Supabase.');

        case 31:
          // Redirigir al frontend después de la autenticación exitosa usando JavaScript
          _redirectUrl = "/dashboard/calendario?googleAuth=success";
          return _context.abrupt("return", (0, _micro.send)(res, 200, "\n          <!DOCTYPE html>\n          <html>\n          <head>\n            <title>Redirigiendo...</title>\n            <script>\n              window.location.href = \"".concat(_redirectUrl, "\";\n            </script>\n          </head>\n          <body>\n            <p>Redirigiendo a tu calendario...</p>\n          </body>\n          </html>\n        ")));

        case 35:
          _context.prev = 35;
          _context.t0 = _context["catch"](7);
          console.error('Error during token exchange or Supabase storage:', _context.t0);
          _redirectUrl3 = "/dashboard/calendario?googleAuth=error&message=".concat(encodeURIComponent(_context.t0.message));
          return _context.abrupt("return", (0, _micro.send)(res, 200, "\n          <!DOCTYPE html>\n          <html>\n          <head>\n            <title>Error de Redirecci\xF3n</title>\n            <script>\n              window.location.href = \"".concat(_redirectUrl3, "\";\n            </script>\n          </head>\n          <body>\n            <p>Ocurri\xF3 un error. Redirigiendo...</p>\n          </body>\n          </html>\n        ")));

        case 40:
          _context.next = 47;
          break;

        case 42:
          // Si no hay código, es la solicitud inicial para iniciar el flujo de autenticación
          scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];
          console.log('Generating Google authorization URL...');
          authorizationUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes.join(' '),
            prompt: 'consent',
            state: state // Asegurarse de que el estado se pase a Google

          });
          console.log('Generated authorizationUrl:', authorizationUrl); // Devolver la URL de autorización al frontend

          return _context.abrupt("return", (0, _micro.send)(res, 200, {
            authorizationUrl: authorizationUrl
          }));

        case 47:
          _context.next = 50;
          break;

        case 49:
          // Métodos no permitidos
          (0, _micro.send)(res, 405, {
            error: 'Method Not Allowed'
          });

        case 50:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[7, 35]]);
};

exports["default"] = _callee;