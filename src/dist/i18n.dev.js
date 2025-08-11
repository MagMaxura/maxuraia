"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _i18next = _interopRequireDefault(require("i18next"));

var _reactI18next = require("react-i18next");

var _i18nextBrowserLanguagedetector = _interopRequireDefault(require("i18next-browser-languagedetector"));

var _translation = _interopRequireDefault(require("./locales/en/translation.json"));

var _translation2 = _interopRequireDefault(require("./locales/es/translation.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var resources = {
  en: {
    translation: _translation["default"]
  },
  es: {
    translation: _translation2["default"]
  }
};

_i18next["default"].use(_i18nextBrowserLanguagedetector["default"]).use(_reactI18next.initReactI18next).init({
  resources: resources,
  fallbackLng: 'es',
  debug: true,
  interpolation: {
    escapeValue: false
  }
});

var _default = _i18next["default"];
exports["default"] = _default;