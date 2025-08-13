"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _supabaseJs = require("@supabase/supabase-js");

var _micro = require("micro");

// Inicializar Supabase para el entorno de backend
var supabaseUrl = process.env.SUPABASE_URL; // Usar variable de backend

var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar la Service Role Key para el backend

var supabase = (0, _supabaseJs.createClient)(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});
var _process$env = process.env,
    GOOGLE_CLIENT_ID = _process$env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET = _process$env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI = _process$env.GOOGLE_REDIRECT_URI; // El cliente OAuth de Google ya no necesita la URI codificada ni limpiada manualmente

var oauth2Client = new _googleapis.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

var _callee = function _callee(req, res) {
  var _req$body, code, userId, tokens, response, upsertData, _ref, data, error, scopes, authorizationUrl;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'POST')) {
            _context.next = 41;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, code = _req$body.code, userId = _req$body.userId;
          console.log('Received code and userId:', {
            code: code,
            userId: userId
          });

          if (!(!code || !userId)) {
            _context.next = 7;
            break;
          }

          console.error('Missing code or userId in request body.');
          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'Code and userId are required.'
          }));

        case 7:
          _context.prev = 7;
          _context.next = 10;
          return regeneratorRuntime.awrap(oauth2Client.getToken(code));

        case 10:
          response = _context.sent;
          tokens = response.tokens;
          console.log('Tokens received from Google:', tokens);
          _context.next = 19;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](7);
          console.error('Error getting tokens from Google:', _context.t0.message);
          return _context.abrupt("return", (0, _micro.send)(res, 500, {
            error: 'Failed to get tokens from Google.',
            details: _context.t0.message
          }));

        case 19:
          // Preparar datos para upsert, incluyendo refresh_token solo si está presente
          upsertData = {
            user_id: userId,
            access_token: tokens.access_token,
            expiry_date: new Date(tokens.expiry_date).toISOString(),
            // Asegurar formato ISO
            token_type: tokens.token_type,
            scope: tokens.scope
          }; // Solo añadir refresh_token si existe (se devuelve solo en la primera autorización)

          if (tokens.refresh_token) {
            upsertData.refresh_token = tokens.refresh_token;
          }

          console.log('Attempting to upsert data to Supabase:', upsertData); // Almacenar tokens de forma segura en Supabase

          _context.next = 24;
          return regeneratorRuntime.awrap(supabase.from('user_google_tokens').upsert(upsertData, {
            onConflict: 'user_id'
          }));

        case 24:
          _ref = _context.sent;
          data = _ref.data;
          error = _ref.error;

          if (!error) {
            _context.next = 30;
            break;
          }

          console.error('Error storing tokens in Supabase:', error);
          return _context.abrupt("return", (0, _micro.send)(res, 500, {
            error: 'Failed to store tokens.',
            details: error.message
          }));

        case 30:
          console.log('Tokens successfully stored in Supabase:', data);
          console.log('Google Calendar connection successful for userId:', userId); // Devolver el access_token y el userId al frontend

          (0, _micro.send)(res, 200, {
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date,
            userId: userId
          });
          _context.next = 39;
          break;

        case 35:
          _context.prev = 35;
          _context.t1 = _context["catch"](1);
          console.error('Error during token exchange:', _context.t1);
          (0, _micro.send)(res, 500, {
            error: 'Failed to exchange code for tokens.',
            details: _context.t1.message
          });

        case 39:
          _context.next = 42;
          break;

        case 41:
          if (req.method === 'GET') {
            // Iniciar el flujo de autenticación de Google
            scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];
            authorizationUrl = oauth2Client.generateAuthUrl({
              access_type: 'offline',
              scope: scopes.join(' '),
              prompt: 'consent'
            });
            (0, _micro.send)(res, 302, null, {
              Location: authorizationUrl
            });
          } else {
            (0, _micro.send)(res, 405, {
              error: 'Method Not Allowed'
            });
          }

        case 42:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 35], [7, 15]]);
};

exports["default"] = _callee;