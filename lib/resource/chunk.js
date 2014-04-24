/**
 * Engine instance.
 * @api private
 *
 * @var {ZenPad} _zenpad
 */
var _zenpad;

/**
 * Create chunk instance.
 * @constructor
 *
 * @param {ZenPad} zenpad
 * @param {String} html
 */
function Chunk(zenpad, html) {
  _zenpad = zenpad;
  this.html = html;
}

/**
 * Render chunk to HTML.
 * @api public
 *
 * @param {Object} data
 * @return {String}
 */
Chunk.prototype.render = function(data) {
  return _zenpad.renderString(this.html, data);
}

module.exports = Chunk;
