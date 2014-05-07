var mkdirp = require('mkdirp');
var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');

/**
 * Engine instance.
 * @api private
 *
 * @var {ZenPad} _zenpad
 */
var _zenpad;

/**
 * Create document instance.
 * @constructor
 *
 * @param {ZenPad} zenpad
 * @param {String} filePath
 * @param {String|Object} content
 */
function Document(zenpad, filePath, content) {
  _zenpad = zenpad;

  this.url = (filePath[0] == '/')
    ? filePath.substr(1)
    : filePath;

  if (typeof content == 'string') {
    var data = content.split(/^[-]{3}$/m, 3);
    if (data.length == 3) {
      var props = yaml.load(data[1].trim());
      this.rawContent = data[2].trim();
    } else {
      var props = {};
      this.rawContent = data[0];
    }
    this.content = zenpad.renderString(this.rawContent, {
      config: _zenpad.config,
      env: _zenpad.env,
      doc: this
    });
  } else {
    props = content;
  }
  for (var k in props) {
    if (props.hasOwnProperty(k)) {
      this[k] = props[k];
    }
  }
  _zenpad.callEvent('beforeDocParse', content);
  _zenpad.callEvent('afterDocParse', this);
}

/**
 * Render document to HTML.
 * @api public
 *
 * @return {String}
 */
Document.prototype.render = function() {
  return this.layout
    ? _zenpad.getTemplate(this.layout, this)
    : _zenpad.renderString(this.content);
};

/**
 * Render document to file.
 * @api public
 */
Document.prototype.build = function() {
  var filePath = path.join(_zenpad.config.buildPath, this.url);
  var dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    mkdirp.sync(dirPath);
  }
  fs.writeFileSync(filePath, this.render());
};

module.exports = Document;
