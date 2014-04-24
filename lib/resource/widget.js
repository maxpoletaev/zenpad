/**
 * Engine instance.
 * @api private
 *
 * @var {ZenPad} _zenpad
 */
var _zenpad;

/**
 * Create widget instance.
 * @constructor
 *
 * @param {ZenPad} zenpad
 * @param {Function} fn
 */
function Widget(zenpad, fn) {
  _zenpad = zenpad;
  this.fn = fn;
}

/**
 * Run widget.
 * @api public
 *
 * @param {Object} params
 * @return {String|Object}
 */
Widget.prototype.run = function(params) {
  return this.fn(zenpad, params);
};

module.exports = Widget;
