const Renderer = require('./renderer')

let settings = {
  htmlStartTag: '<!DOCTYPE html>\n<html>\n',
  htmlEndTag: '\n</html>',
  cacheCompileds: true,
  cacheSettings: {
    storeOnDisk: false,
    recompileOnChange: true
  }
}

function config(newSettings) {
  settings = Object.assign(
    settings, 
    newSettings, 
    {cacheSettings: Object.assign(settings.cacheSettings, newSettings.cacheSettings)}
  );
}
 
function express(filepath, data, callback) {
  const renderer = new Renderer(filepath, data, settings);
  const rendered = settings.htmlStartTag + renderer.render() + settings.htmlEndTag;
  return callback(null, rendered);
}

module.exports = {
  express,
  config,
  Renderer
}