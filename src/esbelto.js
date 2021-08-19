const Renderer = require('./renderer')

let htmlStartTag = '<!DOCTYPE html>\n<html>\n';
let htmlEndTag = '\n</html>';
let cacheCompileds = true;

function config(options) {
  htmlStartTag = options.htmlStartTag || htmlStartTag;
  htmlEndTag = options.htmlEndTag || htmlEndTag;
  cacheCompileds = options.cacheCompileds !== undefined ? options.cacheCompileds : cacheCompileds;
}
 
function express(filepath, options, callback) {
  const renderer = new Renderer(filepath, options, cacheCompileds);
  const rendered = htmlStartTag + renderer.render() + htmlEndTag;
  return callback(null, rendered);
}

module.exports = {
  express,
  config,
  Renderer
}