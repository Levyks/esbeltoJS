const fs = require('fs');
const evaluator = require('./evaluator');
const parser = require('./parser');

class Renderer {
  constructor(filepath, options) {
    this.options = options || {};
    this.filepath = filepath;

    let indexOfLastBar = filepath.lastIndexOf('/');
    if(indexOfLastBar === -1) indexOfLastBar = filepath.lastIndexOf('\\');

    this.dirpath = filepath.substring(0, indexOfLastBar + 1 );
    this.originalFileContents = fs.readFileSync(filepath, 'utf-8');
  }

  render() {
    this.fileContents = this.originalFileContents;
    const scriptBlock = this.extractScriptBlock();
    if(!scriptBlock) return this.fileContents;

    this.mainEval = evaluator.evaluateScriptBlock(scriptBlock, this);

    return parser.parseHtml(this.fileContents, this.filepath, this.mainEval);
  }


  extractScriptBlock() {
    const scriptMatch = this.fileContents.match(/<script[ ]{1,}id=['"]esbelto['"][ ]{0,}>([\s\S]*?)<\/script>/);

    if(!scriptMatch) return false;

    this.fileContents = this.fileContents.substring(0, scriptMatch.index) + this.fileContents.substring(scriptMatch[0].length+scriptMatch.index);
    this.fileContents = this.fileContents.trim();

    return scriptMatch[1];
  }

  include(relpath, options) {
    const renderer = new Renderer(this.dirpath + relpath, options)
    return renderer.render();;
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

  escape(string) {
    return string 
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

}

module.exports = Renderer;
