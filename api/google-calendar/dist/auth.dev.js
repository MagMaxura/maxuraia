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
    GOOGLE_REDIRECT_URI = _process$env.GOOGLE_REDIRECT_URI;
var redirectUriCleaned = GOOGLE_REDIRECT_URI.replace(/\/$/, '');
console.log('Backend Google Redirect URI (cleaned):', redirectUriCleaned);
console.log('Backend Google Client ID:', GOOGLE_CLIENT_ID); // Nuevo log

console.log('Backend Google Client Secret:', GOOGLE_CLIENT_SECRET ? 'present' : 'missing'); // Nuevo log

var oauth2Client = new _googleapis.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUriCleaned);

var _callee = function _callee(req, res) {
  var _req$body, code, userId, _ref, tokens, upsertData, _ref2, data, error, scopes, authorizationUrl;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'POST')) {
            _context.next = 31;
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
          console.log('Auth Request Body:', {
            code: code ? 'present' : 'missing',
            userId: userId
          }); // Log de la URL de intercambio de tokens que se está construyendo

          console.log('Token exchange URL being built...'); // Note: La biblioteca de Google construye la URL final internamente. Este log es para verificar los componentes clave.

          _context.next = 9;
          return regeneratorRuntime.awrap(oauth2Client.getToken(code));

        case 9:
          _ref = _context.sent;
          tokens = _ref.tokens;
          console.log('Google Tokens received:', tokens);
          upsertData = {
            user_id: userId,
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope
          };

          if (tokens.refresh_token) {
            upsertData.refresh_token = tokens.refresh_token;
          }

          _context.next = 16;
          return regeneratorRuntime.awrap(supabase.from('user_google_tokens').upsert(upsertData, {
            onConflict: 'user_id'
          }));

        case 16:
          _ref2 = _context.sent;
          data = _ref2.data;
          error = _ref2.error;

          if (!error) {
            _context.next = 22;
            break;
          }

          console.error('Error storing tokens:', error);
          return _context.abrupt("return", (0, _micro.send)(res, 500, {
            error: 'Failed to store tokens.'
          }));

        case 22:
          (0, _micro.send)(res, 200, {
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date,
            userId: userId
          });
          _context.next = 29;
          break;

        case 25:
          _context.prev = 25;
          _context.t0 = _context["catch"](1);
          console.error('Error during token exchange (full error object):', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to exchange code for tokens.',
            details: _context.t0.message
          });

        case 29:
          _context.next = 32;
          break;

        case 31:
          if (req.method === 'GET') {
            scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];
            authorizationUrl = oauth2Client.generateAuthUrl({
              access_type: 'offline',
              scope: scopes.join(' '),
              prompt: 'consent'
            }); // Log de la URL de autorización que se genera para el frontend

            console.log('Authorization URL sent to frontend:', authorizationUrl);
            (0, _micro.send)(res, 302, null, {
              Location: authorizationUrl
            });
          } else {
            (0, _micro.send)(res, 405, {
              error: 'Method Not Allowed'
            });
          }

        case 32:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 25]]);
};

exports["default"] = _callee;