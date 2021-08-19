const fs = require('fs');
const parser = require('./parser');

class Compiler {
  constructor(filepath, renderer) {
    this.filepath = filepath;
    this.renderer = renderer;

    this.fileContents = fs.readFileSync(filepath, 'utf-8');
  }

  compile() {
    this.toCompile = this.fileContents;

    const scriptBlock = this.extractScriptBlock();
    if(!scriptBlock) return this.toCompile;

    this.compiledStr = '(escapeHTML, getVariables, getInclude, getIncludeScript) => {' + scriptBlock + ';let __esbCompiled = "";';

    this.compiledStr += this.compileSection(this.toCompile);
    
    this.compiledStr += 'return __esbCompiled;}';

    return this.compiledStr;
  }

  getCompiledFunc(renderer = this.renderer) {
    if(!this.compiledStr) this.compile();

    let compiledFunc = eval(this.compiledStr);

    function getInclude() {return (relpath, options) => {return renderer.include(relpath, options)};}
    function getIncludeScript() {return renderer.includeScript;}

    return (data) => {
      function getVariables() {return data;}   
      return compiledFunc(renderer.escapeHTML, getVariables, getInclude, getIncludeScript); 
    }
  }

  compileSection(sectionHtml) {
    let compiledSection = '__esbCompiled += ""';

    parser.findAllMatches(
      sectionHtml, 
      this.filepath, 
      (match, parsedHtml) => {
        parsedHtml = parsedHtml.replace(/"/g, '\\"')
        if(!match) parsedHtml = parsedHtml.trimEnd();
        compiledSection += '+`' + parsedHtml + '`';
    
        if(match) {
          if(match.expression.startsWith('@html')) {
            compiledSection += '+' + match.expression.slice(6);
          } else if (match.expression.trim().startsWith('include')){
            compiledSection += '+' + match.expression;  
          } else {
            compiledSection += '+escapeHTML(' + match.expression + ')';    
          }
        } 
        else compiledSection += ';';
      },
      (match, parsedHtml, blockContent) => {
        parsedHtml = parsedHtml.replace(/"/g, '\\"').trimEnd();
        compiledSection += '+`' + parsedHtml + '`;';

        if(match.expression.startsWith('#if')) {
          compiledSection += this.compileIf(match, blockContent);
        } else if(match.expression.startsWith('#each')) {
          compiledSection += this.compileEach(match, blockContent);
        }
        compiledSection += '__esbCompiled += ""';
        
      }
    );    
    
    return compiledSection;
  }

  compileIf(match, blockContent) {
    let compiled = "";
    const blocks = parser.parseIfBlock(match, blockContent, this.filepath);
    blocks.forEach(block => {
      compiled += block.type;
      if(block.condition) compiled += '(' + block.condition + ')';
      compiled += '{' + this.compileSection(block.content) + '}';
    });
    return compiled;
  }

  compileEach(match, blockContent) {
    const iterator = match.expression.slice(6).split(' as ');
    return iterator[0] + '.forEach((' + iterator[1] + ')=>{' + this.compileSection(blockContent) + '});'
  }

  extractScriptBlock() {
    const scriptMatch = this.toCompile.match(/<script[ ]{1,}id=['"]esbelto['"][ ]{0,}>([\s\S]*?)<\/script>/);

    if(!scriptMatch) return false;

    this.toCompile = this.toCompile.substring(0, scriptMatch.index) + this.toCompile.substring(scriptMatch[0].length+scriptMatch.index);
    this.toCompile = this.toCompile.trim();

    return scriptMatch[1];
  }

}

module.exports = Compiler;
