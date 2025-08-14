"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _micro = require("micro");

var _googleAuthUtils = require("../_lib/googleAuthUtils.js");

var _callee = function _callee(req, res) {
  var _req$body, userId, eventId, accessToken, oauth2Client, calendar;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'DELETE')) {
            _context.next = 22;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, userId = _req$body.userId, eventId = _req$body.eventId; // O req.query si se pasa como parámetro de URL

          if (!(!userId || !eventId)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'User ID and event ID are required.'
          }));

        case 5:
          _context.next = 7;
          return regeneratorRuntime.awrap((0, _googleAuthUtils.getAndRefreshGoogleAccessToken)(userId));

        case 7:
          accessToken = _context.sent;
          oauth2Client = new _googleapis.google.auth.OAuth2();
          oauth2Client.setCredentials({
            access_token: accessToken
          });
          calendar = _googleapis.google.calendar({
            version: 'v3',
            auth: oauth2Client
          });
          _context.next = 13;
          return regeneratorRuntime.awrap(calendar.events["delete"]({
            calendarId: 'primary',
            eventId: eventId
          }));

        case 13:
          (0, _micro.send)(res, 200, {
            message: 'Event deleted successfully.'
          });
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](1);
          console.error('Error deleting calendar event:', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to delete calendar event.',
            details: _context.t0.message
          });

        case 20:
          _context.next = 23;
          break;

        case 22:
          (0, _micro.send)(res, 405, {
            error: 'Method Not Allowed'
          });

        case 23:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 16]]);
};

exports["default"] = _callee;