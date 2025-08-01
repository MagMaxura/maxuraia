"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useToast = useToast;
exports.toast = void 0;

var _react = require("react");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var TOAST_LIMIT = 1;
var TOAST_REMOVE_DELAY = 5000;
var count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

var toastTimeouts = new Map();
var handlers = new Set();

var toast = function toast(_ref) {
  var props = _extends({}, _ref);

  handlers.forEach(function (handler) {
    return handler(props);
  });
  return {
    id: generateId(),
    dismiss: function dismiss() {},
    update: function update() {}
  };
};

exports.toast = toast;

function useToast() {
  var _useState = (0, _react.useState)({
    toasts: []
  }),
      _useState2 = _slicedToArray(_useState, 2),
      state = _useState2[0],
      setState = _useState2[1];

  (0, _react.useEffect)(function () {
    handlers.add(addToast);
    return function () {
      handlers["delete"](addToast);
    };
  }, []);
  var addToast = (0, _react.useCallback)(function (_ref2) {
    var props = _extends({}, _ref2);

    var id = generateId();

    var update = function update(props) {
      return setState(function (state) {
        return _objectSpread({}, state, {
          toasts: state.toasts.map(function (t) {
            return t.id === id ? _objectSpread({}, t, {}, props) : t;
          })
        });
      });
    };

    var dismiss = function dismiss() {
      return setState(function (state) {
        return _objectSpread({}, state, {
          toasts: state.toasts.filter(function (t) {
            return t.id !== id;
          })
        });
      });
    };

    setState(function (state) {
      return _objectSpread({}, state, {
        toasts: [_objectSpread({}, props, {
          id: id,
          dismiss: dismiss
        })].concat(_toConsumableArray(state.toasts)).slice(0, TOAST_LIMIT)
      });
    }); // Auto-dismiss after delay

    var timeout = setTimeout(function () {
      dismiss();
    }, props.duration || TOAST_REMOVE_DELAY);
    toastTimeouts.set(id, timeout);
    return {
      id: id,
      dismiss: dismiss,
      update: update
    };
  }, [setState]); // setState es una referencia estable proporcionada por useState

  (0, _react.useEffect)(function () {
    var timeouts = Array.from(toastTimeouts.values());
    return function () {
      timeouts.forEach(clearTimeout);
      toastTimeouts.clear();
    };
  }, [state.toasts]);
  return {
    toast: addToast,
    toasts: state.toasts
  };
}