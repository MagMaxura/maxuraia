"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAndRefreshGoogleAccessToken = getAndRefreshGoogleAccessToken;

var _googleapis = require("googleapis");

var _supabaseJs = require("@supabase/supabase-js");

// Importar createClient
// Inicializar Supabase para el entorno de backend
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase = (0, _supabaseJs.createClient)(supabaseUrl, supabaseKey);
var _process$env = process.env,
    GOOGLE_CLIENT_ID = _process$env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET = _process$env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI = _process$env.GOOGLE_REDIRECT_URI;
var oauth2Client = new _googleapis.google.auth.OAuth2(VITE_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, VITE_GOOGLE_REDIRECT_URI);

function getAndRefreshGoogleAccessToken(userId) {
  var _ref, data, error, access_token, refresh_token, expiry_date, _ref2, tokens, _ref3, updateError;

  return regeneratorRuntime.async(function getAndRefreshGoogleAccessToken$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (userId) {
            _context.next = 2;
            break;
          }

          throw new Error('User ID is required to get Google access token.');

        case 2:
          _context.next = 4;
          return regeneratorRuntime.awrap(supabase.from('user_google_tokens').select('access_token, refresh_token, expiry_date').eq('user_id', userId).single());

        case 4:
          _ref = _context.sent;
          data = _ref.data;
          error = _ref.error;

          if (!(error || !data)) {
            _context.next = 9;
            break;
          }

          throw new Error('No Google tokens found for this user.');

        case 9:
          access_token = data.access_token, refresh_token = data.refresh_token, expiry_date = data.expiry_date; // 2. Verificar si el access_token ha expirado

          if (!(new Date(expiry_date) < new Date())) {
            _context.next = 32;
            break;
          }

          if (refresh_token) {
            _context.next = 13;
            break;
          }

          throw new Error('Refresh token not found. User needs to re-authenticate with Google.');

        case 13:
          oauth2Client.setCredentials({
            refresh_token: refresh_token
          });
          _context.prev = 14;
          _context.next = 17;
          return regeneratorRuntime.awrap(oauth2Client.refreshAccessToken());

        case 17:
          _ref2 = _context.sent;
          tokens = _ref2.tokens;
          access_token = tokens.access_token;
          expiry_date = tokens.expiry_date; // Actualizar la fecha de expiración
          // 4. Actualizar el nuevo access_token y expiry_date en Supabase

          _context.next = 23;
          return regeneratorRuntime.awrap(supabase.from('user_google_tokens').update({
            access_token: access_token,
            expiry_date: expiry_date // No actualizamos refresh_token aquí, ya que Google solo lo devuelve la primera vez

          }).eq('user_id', userId));

        case 23:
          _ref3 = _context.sent;
          updateError = _ref3.error;

          if (updateError) {
            console.error('Error updating Google tokens in Supabase:', updateError); // No lanzamos un error fatal aquí, ya que el access_token es válido
          }

          _context.next = 32;
          break;

        case 28:
          _context.prev = 28;
          _context.t0 = _context["catch"](14);
          console.error('Error refreshing Google access token:', _context.t0);
          throw new Error('Failed to refresh Google access token. User may need to re-authenticate.');

        case 32:
          return _context.abrupt("return", access_token);

        case 33:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[14, 28]]);
}