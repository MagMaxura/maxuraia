"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = handler;

var _googleapis = require("googleapis");

function handler(req, res) {
  var oauth2Client, accessToken, drive, response, files;
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
          // The user will handle providing the necessary environment variables for Google API access.
          // These typically include GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.
          // For Vercel deployment, these will be set as environment variables.
          oauth2Client = new _googleapis.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI); // Assuming the access token is passed in the request body or headers for simplicity.
          // In a real application, this would come from a secure user session after OAuth flow.

          accessToken = req.query.accessToken; // Or req.headers.authorization

          if (accessToken) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            message: 'Access token is required.'
          }));

        case 6:
          oauth2Client.setCredentials({
            access_token: accessToken
          });
          drive = _googleapis.google.drive({
            version: 'v3',
            auth: oauth2Client
          });
          _context.prev = 8;
          _context.next = 11;
          return regeneratorRuntime.awrap(drive.files.list({
            q: "mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
            fields: 'files(id, name, mimeType, webContentLink)',
            pageSize: 100 // Adjust as needed

          }));

        case 11:
          response = _context.sent;
          files = response.data.files;

          if (!(!files || files.length === 0)) {
            _context.next = 15;
            break;
          }

          return _context.abrupt("return", res.status(200).json({
            message: 'No CV files found in Google Drive.',
            files: []
          }));

        case 15:
          res.status(200).json({
            files: files
          });
          _context.next = 22;
          break;

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](8);
          console.error('Error listing Google Drive files:', _context.t0.message);
          res.status(500).json({
            message: 'Failed to list Google Drive files.',
            error: _context.t0.message
          });

        case 22:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[8, 18]]);
}