"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _micro = require("micro");

var _googleAuthUtils = require("../_lib/googleAuthUtils.js");

var _callee = function _callee(req, res) {
  var _req$body, userId, eventId, updatedEventData, accessToken, oauth2Client, calendar, event, response;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'PUT')) {
            _context.next = 24;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, userId = _req$body.userId, eventId = _req$body.eventId, updatedEventData = _req$body.updatedEventData;

          if (!(!userId || !eventId || !updatedEventData)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'User ID, event ID, and updated event data are required.'
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
            summary: updatedEventData.title,
            description: updatedEventData.description,
            start: {
              dateTime: updatedEventData.start,
              timeZone: updatedEventData.timeZone || 'America/Buenos_Aires'
            },
            end: {
              dateTime: updatedEventData.end,
              timeZone: updatedEventData.timeZone || 'America/Buenos_Aires'
            } // Asegúrate de incluir otras propiedades que quieras actualizar

          };
          _context.next = 14;
          return regeneratorRuntime.awrap(calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
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
          console.error('Error updating calendar event:', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to update calendar event.',
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