'use strict';

exports.__esModule = true;
exports.purgeCache = undefined;
exports.default = calculateNodeHeight;

var _isBrowser = require('./isBrowser');

var _isBrowser2 = _interopRequireDefault(_isBrowser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isIE = _isBrowser2.default ? !!document.documentElement.currentStyle : false;
var hiddenTextarea = _isBrowser2.default && document.createElement('textarea');

var HIDDEN_TEXTAREA_STYLE = {
  'min-height': '0',
  'max-height': 'none',
  height: '0',
  visibility: 'hidden',
  overflow: 'hidden',
  position: 'absolute',
  'z-index': '-1000',
  top: '0',
  right: '0'
};

var SIZING_STYLE = ['letter-spacing', 'line-height', 'font-family', 'font-weight', 'font-size', 'font-style', 'text-rendering', 'text-transform', 'width', 'text-indent', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'box-sizing'];

var computedStyleCache = {};

function calculateNodeHeight(uiTextNode, uid) {
  var useCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var minRows = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var maxRows = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

  if (hiddenTextarea.parentNode === null) {
    document.body.appendChild(hiddenTextarea);
  }

  // Copy all CSS properties that have an impact on the height of the content in
  // the textbox
  var nodeStyling = calculateNodeStyling(uiTextNode, uid, useCache);

  if (nodeStyling === null) {
    return null;
  }

  var paddingSize = nodeStyling.paddingSize,
      borderSize = nodeStyling.borderSize,
      boxSizing = nodeStyling.boxSizing,
      sizingStyle = nodeStyling.sizingStyle;

  // Need to have the overflow attribute to hide the scrollbar otherwise
  // text-lines will not calculated properly as the shadow will technically be
  // narrower for content

  Object.keys(sizingStyle).forEach(function (key) {
    hiddenTextarea.style[key] = sizingStyle[key];
  });
  Object.keys(HIDDEN_TEXTAREA_STYLE).forEach(function (key) {
    hiddenTextarea.style.setProperty(key, HIDDEN_TEXTAREA_STYLE[key], 'important');
  });
  hiddenTextarea.value = uiTextNode.value || uiTextNode.placeholder || 'x';

  var minHeight = -Infinity;
  var maxHeight = Infinity;
  var height = hiddenTextarea.scrollHeight;

  if (boxSizing === 'border-box') {
    // border-box: add border, since height = content + padding + border
    height = height + borderSize;
  } else if (boxSizing === 'content-box') {
    // remove padding, since height = content
    height = height - paddingSize;
  }

  // measure height of a textarea with a single row
  hiddenTextarea.value = 'x';
  var singleRowHeight = hiddenTextarea.scrollHeight - paddingSize;

  if (minRows !== null || maxRows !== null) {
    if (minRows !== null) {
      minHeight = singleRowHeight * minRows;
      if (boxSizing === 'border-box') {
        minHeight = minHeight + paddingSize + borderSize;
      }
      height = Math.max(minHeight, height);
    }
    if (maxRows !== null) {
      maxHeight = singleRowHeight * maxRows;
      if (boxSizing === 'border-box') {
        maxHeight = maxHeight + paddingSize + borderSize;
      }
      height = Math.min(maxHeight, height);
    }
  }

  var rowCount = Math.floor(height / singleRowHeight);

  return { height: height, minHeight: minHeight, maxHeight: maxHeight, rowCount: rowCount };
}

function calculateNodeStyling(node, uid) {
  var useCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (useCache && computedStyleCache[uid]) {
    return computedStyleCache[uid];
  }

  var style = window.getComputedStyle(node);

  if (style === null) {
    return null;
  }

  var sizingStyle = SIZING_STYLE.reduce(function (obj, name) {
    obj[name] = style.getPropertyValue(name);
    return obj;
  }, {});

  var boxSizing = sizingStyle['box-sizing'];

  // IE (Edge has already correct behaviour) returns content width as computed width
  // so we need to add manually padding and border widths
  if (isIE && boxSizing === 'border-box') {
    sizingStyle.width = parseFloat(sizingStyle.width) + parseFloat(style['border-right-width']) + parseFloat(style['border-left-width']) + parseFloat(style['padding-right']) + parseFloat(style['padding-left']) + 'px';
  }

  var paddingSize = parseFloat(sizingStyle['padding-bottom']) + parseFloat(sizingStyle['padding-top']);

  var borderSize = parseFloat(sizingStyle['border-bottom-width']) + parseFloat(sizingStyle['border-top-width']);

  var nodeInfo = {
    sizingStyle: sizingStyle,
    paddingSize: paddingSize,
    borderSize: borderSize,
    boxSizing: boxSizing
  };

  if (useCache) {
    computedStyleCache[uid] = nodeInfo;
  }

  return nodeInfo;
}

var purgeCache = exports.purgeCache = function purgeCache(uid) {
  return delete computedStyleCache[uid];
};