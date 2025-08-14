"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _micro = require("micro");

var _googleAuthUtils = require("../_lib/googleAuthUtils.js");

var _callee = function _callee(req, res) {
  var userId, accessToken, oauth2Client, calendar, now, oneMonthLater, response, events;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'GET')) {
            _context.next = 27;
            break;
          }

          _context.prev = 1;
          userId = req.query.userId;

          if (userId) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'User ID is required.'
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
          now = new Date();
          oneMonthLater = new Date();
          oneMonthLater.setMonth(now.getMonth() + 1);
          _context.next = 16;
          return regeneratorRuntime.awrap(calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: oneMonthLater.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
          }));

        case 16:
          response = _context.sent;
          events = response.data.items;
          (0, _micro.send)(res, 200, {
            events: events
          });
          _context.next = 25;
          break;

        case 21:
          _context.prev = 21;
          _context.t0 = _context["catch"](1);
          console.error('Error listing calendar events:', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to list calendar events.',
            details: _context.t0.message
          });

        case 25:
          _context.next = 28;
          break;

        case 27:
          (0, _micro.send)(res, 405, {
            error: 'Method Not Allowed'
          });

        case 28:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 21]]);
};

exports["default"] = _callee;