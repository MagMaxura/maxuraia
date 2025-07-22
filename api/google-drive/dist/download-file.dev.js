"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = handler;

var _googleapis = require("googleapis");

function handler(req, res) {
  var _req$query, fileId, accessToken, auth, drive, fileMetadata, mimeType, fileName, response;

  return regeneratorRuntime.async(function handler$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(req.method !== 'GET')) {
            _context.next = 2;
            break;
          }

          return _context.abrupt("return", res.status(405).json({
            message: 'Method Not Allowed'
          }));

        case 2:
          _req$query = req.query, fileId = _req$query.fileId, accessToken = _req$query.accessToken;

          if (!(!fileId || !accessToken)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            message: 'File ID and access token are required.'
          }));

        case 5:
          _context.prev = 5;
          auth = new _googleapis.google.auth.OAuth2();
          auth.setCredentials({
            access_token: accessToken
          });
          drive = _googleapis.google.drive({
            version: 'v3',
            auth: auth
          }); // Get file metadata to determine mimeType

          _context.next = 11;
          return regeneratorRuntime.awrap(drive.files.get({
            fileId: fileId,
            fields: 'mimeType,name'
          }));

        case 11:
          fileMetadata = _context.sent;
          mimeType = fileMetadata.data.mimeType;
          fileName = fileMetadata.data.name; // Download the file

          _context.next = 16;
          return regeneratorRuntime.awrap(drive.files.get({
            fileId: fileId,
            alt: 'media'
          }, {
            responseType: 'stream'
          }));

        case 16:
          response = _context.sent;
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Disposition', "attachment; filename=\"".concat(fileName, "\""));
          response.data.pipe(res);
          _context.next = 26;
          break;

        case 22:
          _context.prev = 22;
          _context.t0 = _context["catch"](5);
          console.error('Error downloading Google Drive file:', _context.t0.message);
          res.status(500).json({
            message: 'Failed to download file from Google Drive.',
            error: _context.t0.message
          });

        case 26:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[5, 22]]);
}