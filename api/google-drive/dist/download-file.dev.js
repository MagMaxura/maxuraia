"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = handler;

var _googleapis = require("googleapis");

var _stream = require("stream");

function handler(req, res) {
  var _req$query, fileId, accessToken, oauth2Client, drive, fileMetadata, fileName, mimeType, response;

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
          oauth2Client = new _googleapis.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
          oauth2Client.setCredentials({
            access_token: accessToken
          });
          drive = _googleapis.google.drive({
            version: 'v3',
            auth: oauth2Client
          });
          _context.prev = 8;
          _context.next = 11;
          return regeneratorRuntime.awrap(drive.files.get({
            fileId: fileId,
            fields: 'name, mimeType'
          }));

        case 11:
          fileMetadata = _context.sent;
          fileName = fileMetadata.data.name;
          mimeType = fileMetadata.data.mimeType;
          _context.next = 16;
          return regeneratorRuntime.awrap(drive.files.get({
            fileId: fileId,
            alt: 'media'
          }, {
            responseType: 'stream'
          }));

        case 16:
          response = _context.sent;
          res.setHeader('Content-Disposition', "attachment; filename=\"".concat(fileName, "\""));
          res.setHeader('Content-Type', mimeType); // Pipe the Google Drive file stream directly to the response

          response.data.on('end', function () {
            console.log('File download complete.');
          }).on('error', function (err) {
            console.error('Error during file download:', err);
            res.status(500).json({
              message: 'Failed to download file.',
              error: err.message
            });
          }).pipe(res);
          _context.next = 26;
          break;

        case 22:
          _context.prev = 22;
          _context.t0 = _context["catch"](8);
          console.error('Error downloading Google Drive file:', _context.t0.message);
          res.status(500).json({
            message: 'Failed to download Google Drive file.',
            error: _context.t0.message
          });

        case 26:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[8, 22]]);
}