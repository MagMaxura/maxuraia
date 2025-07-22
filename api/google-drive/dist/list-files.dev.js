"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = handler;

var _googleapis = require("googleapis");

function handler(req, res) {
  var accessToken, auth, drive, response;
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
          accessToken = req.query.accessToken;

          if (accessToken) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            message: 'Access token is required.'
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
          }); // List files, filtering for PDF and DOCX MIME types

          _context.next = 11;
          return regeneratorRuntime.awrap(drive.files.list({
            q: "mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/msword'",
            fields: 'files(id, name, mimeType)',
            pageSize: 100 // Adjust as needed

          }));

        case 11:
          response = _context.sent;
          res.status(200).json({
            files: response.data.files
          });
          _context.next = 19;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](5);
          console.error('Error listing Google Drive files:', _context.t0.message);
          res.status(500).json({
            message: 'Failed to list files from Google Drive.',
            error: _context.t0.message
          });

        case 19:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[5, 15]]);
}