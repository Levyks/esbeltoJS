const Compiler = require('./compiler');
const fs = require('fs');

class Renderer {
  static compiledFuncs = {};

  constructor(filepath, data, settings) {
    this.data = data || {};
    this.filepath = filepath;
    this.settings = settings;

    let indexOfLastBar = filepath.lastIndexOf('/');
    if(indexOfLastBar === -1) indexOfLastBar = filepath.lastIndexOf('\\');

    this.dirpath = filepath.substring(0, indexOfLastBar + 1 );

    this.createCompilerIfNeeded();
  }

  createCompilerIfNeeded() {
    if(this.settings.cacheCompileds) {
      if(this.settings.cacheSettings.recompileOnChange || this.settings.cacheSettings.storeOnDisk) {
        const fileStats = fs.statSync(this.filepath);
        const lastModified = fileStats.mtime;

        if(this.settings.cacheSettings.storeOnDisk) {
          const extension = this.data.settings['view engine'];
          const compiledFilepath = this.filepath.slice(0, this.filepath.length - extension.length) + 'esbcp.js';
          if(fs.existsSync(compiledFilepath)) {
            const compiledFileStats = fs.statSync(compiledFilepath);
            const lastModifiedCompiled = compiledFileStats.mtime;
            if(lastModified < lastModifiedCompiled) {
              const compiledStr = fs.readFileSync(compiledFilepath, 'utf-8') 
              return this.compiledFunc = Compiler.getFuncFromStr(compiledStr, this);
            }
          }

        } else {
          const compiledFunc = Renderer.compiledFuncs[this.filepath];
          if(compiledFunc && lastModified < compiledFunc.compiledAt) {
            return this.compiledFunc = compiledFunc;
          }   
        }
      } else {
        const compiledFunc = Renderer.compiledFuncs[this.filepath];
        if(compiledFunc) return this.compiledFunc = compiledFunc; 
      }
    }

    return this.compiler = new Compiler(this.filepath, this);
  }

  cacheCompiled() {
    if(this.settings.cacheSettings.storeOnDisk) {
      const extension = this.data.settings['view engine'];
      const compiledFilepath = this.filepath.slice(0, this.filepath.length - extension.length) + 'esbcp.js';
      fs.writeFileSync(compiledFilepath, this.compiledFunc.originalFuncStr);
    } else {
      this.compiledFunc.originalFuncStr = undefined;
      Renderer.compiledFuncs[this.filepath] = this.compiledFunc;
    }
  }

  render() {
    if(!this.compiledFunc) {
      this.compiledFunc = this.compiler.getCompiledFunc();

      if(this.settings.cacheCompileds) this.cacheCompiled();
    }

    return this.compiledFunc(this.data);
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

  include(relpath, data = {}) {
    const renderer = new Renderer(this.dirpath + relpath, Object.assign(data, {settings: this.data.settings}), this.settings);
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
