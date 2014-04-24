var zenpad = require('../zenpad');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');

module.exports = function(program) {
  var config = zenpad.config;
  program.command('build')
    .description('build project')
    .option('-e, --env <env>', 'set environment')
    .action(function() {
      var args = program.args.slice(0);
      var cmd = args.pop();
      if (cmd.env) {
        zenpad.setEnv(cmd.env);
      }
      zenpad.getDocs('/', { depth: -1 }).forEach(function(doc) {
        console.log('> ' + doc.url);
        doc.build();
      });
      zenpad.callEvent('afterBuild');
    });
}
