const Renderer = require('./renderer')

htmlStartTag = '<!DOCTYPE html>\n<html>\n';
htmlEndTag = '\n</html>';

function config(options) {
  htmlStartTag = options.htmlStartTag || htmlStartTag;
  htmlEndTag = options.htmlEndTag || htmlEndTag;
}
 
function express(filepath, options, callback) {
  const renderer = new Renderer(filepath, options);
  const rendered = htmlStartTag + renderer.render() + htmlEndTag;
  return callback(null, rendered);
}

module.exports = {
  express,
  config,
  Renderer
}