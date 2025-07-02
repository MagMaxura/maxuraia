"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkEmailExists = checkEmailExists;
exports.saveRecruiter = saveRecruiter;
exports.getRecruiterByEmail = getRecruiterByEmail;
exports.supabase = void 0;

var _supabaseJs = require("@supabase/supabase-js");

var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
var SITE_URL = process.env.VITE_SITE_URL;
var supabase;
exports.supabase = supabase;

if (typeof window !== 'undefined') {
  // Browser environment
  exports.supabase = supabase = (0, _supabaseJs.createClient)(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      redirectTo: "".concat(SITE_URL, "/auth/callback")
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'employsmartia'
      }
    }
  }); // Add auth state change listener only in browser

  supabase.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      // Delete all supabase-related items from localStorage
      for (var _i = 0, _Object$keys = Object.keys(localStorage); _i < _Object$keys.length; _i++) {
        var key = _Object$keys[_i];

        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      }
    }
  });
} else {
  // Server environment (e.g., Vercel function, Node.js backend)
  // Initialize client without browser-specific auth options
  // Consider using service_role key if needed for elevated privileges
  // For webhooks, standard key might be sufficient depending on RLS
  exports.supabase = supabase = (0, _supabaseJs.createClient)(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'employsmartia'
      }
    }
  });
}

function checkEmailExists(email) {
  var _ref, data, error;

  return regeneratorRuntime.async(function checkEmailExists$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(supabase.from('reclutadores').select('id').eq('email', email));

        case 3:
          _ref = _context.sent;
          data = _ref.data;
          error = _ref.error;

          if (!error) {
            _context.next = 8;
            break;
          }

          throw error;

        case 8:
          return _context.abrupt("return", data && data.length > 0);

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);
          console.error('Error checking email:', _context.t0);
          throw _context.t0;

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 11]]);
}

function saveRecruiter(recruiterData) {
  var _ref2, data, error;

  return regeneratorRuntime.async(function saveRecruiter$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(supabase.from('reclutadores').insert([recruiterData]).select().single());

        case 3:
          _ref2 = _context2.sent;
          data = _ref2.data;
          error = _ref2.error;

          if (!error) {
            _context2.next = 8;
            break;
          }

          throw error;

        case 8:
          return _context2.abrupt("return", data);

        case 11:
          _context2.prev = 11;
          _context2.t0 = _context2["catch"](0);
          console.error('Error saving recruiter:', _context2.t0);
          throw _context2.t0;

        case 15:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 11]]);
}

function getRecruiterByEmail(email) {
  var _ref3, data, error;

  return regeneratorRuntime.async(function getRecruiterByEmail$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(supabase.from('reclutadores').select('*').eq('email', email).maybeSingle());

        case 3:
          _ref3 = _context3.sent;
          data = _ref3.data;
          error = _ref3.error;

          if (!error) {
            _context3.next = 8;
            break;
          }

          throw error;

        case 8:
          return _context3.abrupt("return", data);

        case 11:
          _context3.prev = 11;
          _context3.t0 = _context3["catch"](0);
          console.error('Error fetching recruiter:', _context3.t0);
          throw _context3.t0;

        case 15:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 11]]);
}