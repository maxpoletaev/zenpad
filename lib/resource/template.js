/**
 * Engine instance.
 * @api private
 *
 * @var {ZenPad} _zenpad
 */
var _zenpad;

/**
 * Create template instance.
 * @constructor
 *
 * @param {ZenPad} zenpad
 * @param {String} html
 */
var Template = function(zenpad, html) {
  _zenpad = zenpad;
  this.html = html;
};

/**
 * Render template to HTML.
 * @api public
 *
 * @param {Object} data
 * @return {String}
 */
Template.prototype.render = function(data) {
  return _zenpad.renderString(this.html, {
    config: _zenpad.config,
    env: _zenpad.env,
    doc: data
  });
};

module.exports = Template;
