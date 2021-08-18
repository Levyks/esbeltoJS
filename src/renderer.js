const Compiler = require('./compiler');

class Renderer {
  static compiledFuncs = {};

  constructor(filepath, options, cacheCompileds) {
    this.options = options || {};
    this.filepath = filepath;
    this.cacheCompileds = cacheCompileds;

    let indexOfLastBar = filepath.lastIndexOf('/');
    if(indexOfLastBar === -1) indexOfLastBar = filepath.lastIndexOf('\\');

    this.dirpath = filepath.substring(0, indexOfLastBar + 1 );

    if(!cacheCompileds || !Renderer.compiledFuncs[filepath]){
      this.compiler = new Compiler(filepath, this);
    } 
  }

  render() {
    let compiledFunc = Renderer.compiledFuncs[this.filepath] || this.compiler.getCompiledFunc();

    if(this.cacheCompileds) Renderer.compiledFuncs[this.filepath] = compiledFunc;

    return compiledFunc(this.options);
  }

  escapeHTML(str) {
    str = str.toString();
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  include(relpath, options) {
    const renderer = new Renderer(this.dirpath + relpath, options, this.cacheCompileds);
    return renderer.render();
  }

  includeScript(script) {
    if(typeof script === 'string') return `<script src="${script}"></script>`;
    let scriptString = '<script ';
    Object.keys(script).forEach(key => {
      scriptString += `${key}="${script[key]}" `;
    });
    scriptString += `></script>`;
    return scriptString;
  }
}

module.exports = Renderer;
