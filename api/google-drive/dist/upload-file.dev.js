"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _googleapis = require("googleapis");

var _micro = require("micro");

var _googleAuthUtils = require("../_lib/googleAuthUtils");

var _stream = require("stream");

var _callee = function _callee(req, res) {
  var _req$body, userId, fileName, mimeType, fileContentBase64, accessToken, oauth2Client, drive, fileBuffer, media, requestBody, response;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method === 'POST')) {
            _context.next = 26;
            break;
          }

          _context.prev = 1;
          _req$body = req.body, userId = _req$body.userId, fileName = _req$body.fileName, mimeType = _req$body.mimeType, fileContentBase64 = _req$body.fileContentBase64;

          if (!(!userId || !fileName || !mimeType || !fileContentBase64)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", (0, _micro.send)(res, 400, {
            error: 'userId, fileName, mimeType, and fileContentBase64 are required.'
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
          drive = _googleapis.google.drive({
            version: 'v3',
            auth: oauth2Client
          });
          fileBuffer = Buffer.from(fileContentBase64, 'base64');
          media = {
            mimeType: mimeType,
            body: _stream.Readable.from([fileBuffer])
          };
          requestBody = {
            name: fileName // Puedes añadir un parent para especificar una carpeta: parents: ['folder_id']

          };
          _context.next = 16;
          return regeneratorRuntime.awrap(drive.files.create({
            requestBody: requestBody,
            media: media,
            fields: 'id,name'
          }));

        case 16:
          response = _context.sent;
          (0, _micro.send)(res, 200, {
            file: response.data
          });
          _context.next = 24;
          break;

        case 20:
          _context.prev = 20;
          _context.t0 = _context["catch"](1);
          console.error('Error uploading file to Google Drive:', _context.t0);
          (0, _micro.send)(res, 500, {
            error: 'Failed to upload file to Google Drive.',
            details: _context.t0.message
          });

        case 24:
          _context.next = 27;
          break;

        case 26:
          (0, _micro.send)(res, 405, {
            error: 'Method Not Allowed'
          });

        case 27:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 20]]);
};

exports["default"] = _callee;