var fs = require('fs');
var path = require('path');
var events = require('events');
var extend = require('extend');
var moment = require('moment');
var handlebars = require('handlebars');
var eventEmmiter = new events.EventEmitter();

var Document = require('./resource/document');
var Template = require('./resource/template');
var Widget = require('./resource/widget');
var Chunk = require('./resource/chunk');

/**
 * Default configuation
 * @api private
 *
 * @var {Object} defaultConfig
 */
var defaultConfig = {
  buildPath: 'build',
  srcPath: 'src',
  templatesDir: 'layouts',
  widgetsDir: 'widgets',
  pluginsDir: 'plugins',
  chunksDir: 'chunks',
  docsDir: 'docs',
  locale: 'en',
  siteName: 'ZenPad',
  siteUrl: 'http://localhost:8080/',
  cutTag: '<!-- cut -->'
};

/**
 * Cache.
 * @api private
 *
 * @var {Object} cache
 */
var cache = {
  templates: {},
  widgets: {},
  chunks: {},
  docs: {}
};

/**
 * Create Engine instance.
 * @constructor
 */
function ZenPad(config) {

  this.env = 'default';
  this.config = extend(defaultConfig, config[this.env]);

  /**
   * Load plugins.
   */

  var pluginsPath = path.resolve(this.config.srcPath, this.config.pluginsDir);
  if (fs.existsSync(pluginsPath)) {
    var that = this;
    fs.readdirSync(pluginsPath).forEach(function(file) {
      require(path.resolve(pluginsPath, file))(that);
    });
  }

};

/**
 * Get document.
 * @api public
 *
 * @param {String} filePath
 * @return {Document}
 */
ZenPad.prototype.getDoc = function(filePath) {
  if (cache.docs[filePath]) {
    return cache.docs[filePath];
  }
  var docContent = fs.readFileSync(path.join(
    this.config.srcPath,
    this.config.docsDir,
    filePath
  ), 'utf-8');

  var doc = new Document(this, filePath, docContent);
  return cache.docs[filePath] = doc;
};

/**
 * Get documents.
 * @api public
 *
 * @param {String} dirPath
 * @param {Object} query
 * @return {Array}
 */
ZenPad.prototype.getDocs = function(dirPath, query) {
  var docs = this._readDocsDir(dirPath, query.depth);
  var result = [];

  for (var i=0, j=docs.length; i<j; i++) {
    var doc = this.getDoc(docs[i]);
    result.push(doc);
  }

  if (query.filter) {
    result = result.filter(query.filter);
  }

  return result;
};

/**
 * @api public
 * @param {String} url
 * @param {Object} data
 */
ZenPad.prototype.createDoc = function(url, data) {
  return new Document(this, url, data);
};

/**
 * Get widget.
 * @api public
 *
 * @param {String} filePath
 * @param {Object} params
 * @return {*}
 */
ZenPad.prototype.getWidget = function(filePath, params) {
  if (cache.widgets[filePath]) {
    var widget = this._widgets[filePath];
  } else {
    var requirePath = require.resolve('../../../' + path.join(
      this.config.srcPath,
      this.config.widgetsDir,
      filePath
    ));
    var widget = new Widget(this, require(requirePath));
    cache.widgets[requirePath] = widget;
  }
  return widget.run(params);
};

/**
 * Get chunk.
 * @api public
 *
 * @param {String} filePath
 * @param {Object} data
 * @return {String}
 */
ZenPad.prototype.getChunk = function(filePath, data) {
  if (cache.chunks[filePath]) {
    var chunk = cache.chunks[filePath];
  } else {
    var chunkContent = fs.readFileSync(path.join(
      this.config.srcPath,
      this.config.chunksDir,
      filePath + '.html'
    ), 'utf-8');
    var chunk = new Chunk(this, chunkContent);
    cache.chunks[filePath] = chunk;
  }
  return chunk.render(data);
};

/**
 * Render template.
 * @api public
 *
 * @param {String} filePath
 * @param {Object} data
 * @return {String}
 */
ZenPad.prototype.getTemplate = function(filePath, data) {
  if (cache.templates[filePath]) {
    var template = cache.templates[filePath];
  } else {
    var templateContent = fs.readFileSync(path.join(
      this.config.srcPath,
      this.config.templatesDir,
      filePath + '.html'
    ), 'utf-8');
    var template = new Template(this, templateContent);
    cache.templates[filePath] = template;
  }
  return template.render(data);
};

/**
 * Render string.
 * @public
 *
 * @param {String} source
 * @param {Object} data
 */
ZenPad.prototype.renderString = function(source, data) {
  return handlebars.compile(source)(data);
};

/**
 * Listen event.
 * @api public
 *
 * @param {String} eventName
 * @param {Function} callback
 */
ZenPad.prototype.listenEvent = function() {
  eventEmmiter.on.apply(this, arguments);
};

/**
 * Call event.
 * @api public
 *
 * @param {String} eventName
 * @param {*} arguments
 */
ZenPad.prototype.callEvent = function() {
  return eventEmmiter.emit.apply(this, arguments);
};

/**
 * Set environment.
 * @api public
 *
 * @param {String} env
 */
ZenPad.prototype.setEnv = function(env) {
  if (fs.existsSync('./zenpad.js')) {
    var config = require('../../../zenpad');
    this.config = extend(this.config, config[this.env = env]);
  }
};

/**
 * Read document dir.
 * @api public
 *
 * @param {String} dir
 * @param {Number} depth
 * @return {Array}
 */
ZenPad.prototype._readDocsDir = function(dir, depth) {
  var realDir = path.join(this.config.srcPath, this.config.docsDir, dir);
  var files = fs.readdirSync(realDir);
  var result = [];
  if (typeof depth != 'number') {
    depth = -1;
  }
  if (depth >= 1 || depth == -1) {
    var that = this;
    if (depth != -1) depth--;
    files.forEach(function(file) {
      if (path.basename(file).indexOf('.') !== 0) {
        var filePath = path.join(realDir, file);
        var fileStat = fs.lstatSync(filePath);
        if (fileStat.isFile()) {
          result.push(path.join(dir, file));
        } else if (fileStat.isDirectory()) {
          var innerFiles = that._readDocsDir(path.join(dir, file), depth);
          innerFiles.forEach(function(innerFile) {
            result.push(innerFile);
          });
        }
      }
    });
  }
  return result;
};

/**
 * ZenPad exports.
 */
module.exports = zenpad = new ZenPad(fs.existsSync('./zenpad.js')
  ? require('../../../zenpad')
  : {}
);

/**
 * Helper for call a widget from template.
 * {{widget 'name' tpl='row'}}
 */
handlebars.registerHelper('widget', function(name, params) {
  return zenpad.getWidget(name, params);
});

/**
 * Helper for show a chunk from template.
 * {{chunk 'name' key='val'}}
 */
handlebars.registerHelper('chunk', function(name, params) {
  var data = params.hash;
  data.doc = params.data.root.doc;
  data.config = params.data.root.config;
  return zenpad.getChunk(name, data);
});

/**
 * Date helper for handlebars.
 * {{date new Date() format='LL'}}
 */
handlebars.registerHelper('date', function(date, params) {
  var format = params.hash.format || 'LL';
  var lang = params.hash.lang || zenpad.config.locale;
  if (format == 'ISO' || format == 'iso') {
    var result = moment(date).toISOString();
  } else {
    if (moment.lang() != lang) {
      moment.lang(lang);
    }
    var result = moment(date).format(format);
  }
  return result;
});

/**
 * Get cutted content.
 * {{cut 'content' tag='<!-- cut -->'}}
 */
handlebars.registerHelper('cut', function(content, params) {
  var parts = content.split(params.hash.tag || zenpad.config.cutTag);
  return parts[0];
});

/**
 * Support expressions in `if` helper.
 * {{#if (assert 1 '>' 2)}} {{/if}}
 */
handlebars.registerHelper('assert', function(val1, expr, val2) {
  if (expr == '=' || expr == '==') {
    return val1 == val2;
  } else if (expr == '!=') {
    return val1 != val2;
  } else if (expr == '>') {
    return val1 > val2;
  } else if (expr == '>=') {
    return val1 >= val2;
  } else if (expr == '<') {
    return val1 < val2;
  } else if (expr == '<=') {
    return val1 <= val2;
  }
});
