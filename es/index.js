var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * <TextareaAutosize />
 */

import React from 'react';
import PropTypes from 'prop-types';
import calculateNodeHeight, { purgeCache } from './calculateNodeHeight';
import isBrowser from './isBrowser';
import uid from './uid';

var noop = function noop() {};

var _ref = isBrowser && window.requestAnimationFrame ? [window.requestAnimationFrame.bind(window), window.cancelAnimationFrame.bind(window)] : [setTimeout, clearTimeout],
    onNextFrame = _ref[0],
    clearNextFrameAction = _ref[1];

var TextareaAutosize = function (_React$Component) {
  _inherits(TextareaAutosize, _React$Component);

  function TextareaAutosize(props) {
    _classCallCheck(this, TextareaAutosize);

    var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

    _this._resizeLock = false;

    _this._onRootDOMNode = function (node) {
      _this._rootDOMNode = node;

      if (_this.props.inputRef) {
        _this.props.inputRef(node);
      }
    };

    _this._onChange = function (event) {
      if (!_this._controlled) {
        _this._resizeComponent();
      }
      _this.props.onChange(event);
    };

    _this._resizeComponent = function () {
      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;

      if (typeof _this._rootDOMNode === 'undefined') {
        callback();
        return;
      }

      var nodeHeight = calculateNodeHeight(_this._rootDOMNode, _this._uid, _this.props.useCacheForDOMMeasurements, _this.props.minRows, _this.props.maxRows);

      if (nodeHeight === null) {
        callback();
        return;
      }

      var height = nodeHeight.height,
          minHeight = nodeHeight.minHeight,
          maxHeight = nodeHeight.maxHeight,
          rowCount = nodeHeight.rowCount;


      _this.rowCount = rowCount;

      if (_this.state.height !== height || _this.state.minHeight !== minHeight || _this.state.maxHeight !== maxHeight) {
        _this.setState({ height: height, minHeight: minHeight, maxHeight: maxHeight }, callback);
        return;
      }

      callback();
    };

    _this.state = {
      height: props.style && props.style.height || 0,
      minHeight: -Infinity,
      maxHeight: Infinity
    };

    _this._uid = uid();
    _this._controlled = typeof props.value === 'string';
    return _this;
  }

  TextareaAutosize.prototype.render = function render() {
    var _props = this.props,
        _minRows = _props.minRows,
        _maxRows = _props.maxRows,
        _onHeightChange = _props.onHeightChange,
        _useCacheForDOMMeasurements = _props.useCacheForDOMMeasurements,
        _inputRef = _props.inputRef,
        props = _objectWithoutProperties(_props, ['minRows', 'maxRows', 'onHeightChange', 'useCacheForDOMMeasurements', 'inputRef']);

    props.style = _extends({}, props.style, {
      height: this.state.height
    });

    var maxHeight = Math.max(props.style.maxHeight || Infinity, this.state.maxHeight);

    if (maxHeight < this.state.height) {
      props.style.overflow = 'hidden';
    }

    return React.createElement('textarea', _extends({}, props, {
      onChange: this._onChange,
      ref: this._onRootDOMNode
    }));
  };

  TextareaAutosize.prototype.componentDidMount = function componentDidMount() {
    var _this2 = this;

    this._resizeComponent();
    // Working around Firefox bug which runs resize listeners even when other JS is running at the same moment
    // causing competing rerenders (due to setState in the listener) in React.
    // More can be found here - facebook/react#6324
    this._resizeListener = function () {
      if (_this2._resizeLock) {
        return;
      }
      _this2._resizeLock = true;
      _this2._resizeComponent(function () {
        return _this2._resizeLock = false;
      });
    };
    window.addEventListener('resize', this._resizeListener);
  };

  TextareaAutosize.prototype.componentWillReceiveProps = function componentWillReceiveProps() {
    var _this3 = this;

    this._clearNextFrame();
    this._onNextFrameActionId = onNextFrame(function () {
      return _this3._resizeComponent();
    });
  };

  TextareaAutosize.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
    if (this.state.height !== prevState.height) {
      this.props.onHeightChange(this.state.height, this);
    }
  };

  TextareaAutosize.prototype.componentWillUnmount = function componentWillUnmount() {
    this._clearNextFrame();
    window.removeEventListener('resize', this._resizeListener);
    purgeCache(this._uid);
  };

  TextareaAutosize.prototype._clearNextFrame = function _clearNextFrame() {
    clearNextFrameAction(this._onNextFrameActionId);
  };

  return TextareaAutosize;
}(React.Component);

TextareaAutosize.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onHeightChange: PropTypes.func,
  useCacheForDOMMeasurements: PropTypes.bool,
  minRows: PropTypes.number,
  maxRows: PropTypes.number,
  inputRef: PropTypes.func
};
TextareaAutosize.defaultProps = {
  onChange: noop,
  onHeightChange: noop,
  useCacheForDOMMeasurements: false
};
export default TextareaAutosize;