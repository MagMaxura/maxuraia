"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cn = cn;
exports.sha256 = sha256;

var _clsx = require("clsx");

var _tailwindMerge = require("tailwind-merge");

function cn() {
  for (var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++) {
    inputs[_key] = arguments[_key];
  }

  return (0, _tailwindMerge.twMerge)((0, _clsx.clsx)(inputs));
}

function sha256(message) {
  var msgBuffer, hashBuffer, hashArray, hexHash;
  return regeneratorRuntime.async(function sha256$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // encode as UTF-8
          msgBuffer = new TextEncoder().encode(message); // hash the message

          _context.next = 3;
          return regeneratorRuntime.awrap(crypto.subtle.digest('SHA-256', msgBuffer));

        case 3:
          hashBuffer = _context.sent;
          // convert ArrayBuffer to Array of byte values
          hashArray = Array.from(new Uint8Array(hashBuffer)); // convert bytes to hex string

          hexHash = hashArray.map(function (b) {
            return b.toString(16).padStart(2, '0');
          }).join('');
          return _context.abrupt("return", hexHash);

        case 7:
        case "end":
          return _context.stop();
      }
    }
  });
}