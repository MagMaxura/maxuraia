"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _micro = require("micro");

var _googleAuthUtils = require("../_lib/googleAuthUtils.js");

var _callee = function _callee(req, res) {
  var _req$body, userId, eventData, accessToken, oauth2Client, calendar, event, response;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'POST')) {
            _context.next = 24;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, userId = _req$body.userId, eventData = _req$body.eventData;

          if (!(!userId || !eventData)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'User ID and event data are required.'
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
          event = {
            summary: eventData.title,
            description: eventData.description,
            start: eventData.start,
            end: eventData.end // Puedes añadir más propiedades del evento aquí, como attendees, location, etc.

          };
          _context.next = 14;
          return regeneratorRuntime.awrap(calendar.events.insert({
            calendarId: 'primary',
            resource: event
          }));

        case 14:
          response = _context.sent;
          (0, _micro.send)(res, 200, {
            event: response.data
          });
          _context.next = 22;
          break;

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](1);
          console.error('Error creating calendar event:', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to create calendar event.',
            details: _context.t0.message
          });

        case 22:
          _context.next = 25;
          break;

        case 24:
          (0, _micro.send)(res, 405, {
            error: 'Method Not Allowed'
          });

        case 25:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 18]]);
};

exports["default"] = _callee;