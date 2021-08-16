const fs = require('fs');

let dirpath;
let evaluateExpr = {};

class EsbeltoError extends Error {
  constructor(message, stack) {
    super();

    this.message = `${message}\n`;
    this.message += ` in expression '{${stack.expression}}'\n`;
    this.message += ` at '${stack.filepath}'`;

    this.name = "EsbeltoError";
  }
}

function render(filepath, options, callback) {
  let indexOfLastBar = filepath.lastIndexOf('/');
  if(indexOfLastBar === -1) indexOfLastBar = filepath.lastIndexOf('\\');
  dirpath = filepath.substring(0, indexOfLastBar + 1 );
  
  const rendered = render.htmlStartTag + parseFile(filepath, options) + render.htmlEndTag;

  return callback(null, rendered);
}

function getInclude() {
  return include;
}

function include(relpath, options) {
  return parseFile(dirpath + relpath, options);
}

function getIncludeScript() {
  return includeScript;
}

function includeScript(script) {
  if(typeof script === 'string') return `<script src=${script}></script>`;
  let scriptString = '<script ';
  Object.keys(script).forEach(key => {
    scriptString += `${key}=${script[key]} `;
  });
  scriptString += `</script>`;
  return scriptString;
}

function tryEval(evalFunc, expression, customStack) {
  try {
    return evalFunc(expression);
  } catch (e) {
    throw new EsbeltoError(e.message, customStack);
  }
}

function parseFile(filepath, options) {
  function getVariables() {
    return options || {};
  }

  const fileString = fs.readFileSync(filepath, 'utf-8');

  const scriptMatch = fileString.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    
  if(scriptMatch) {
    const scriptWithTags = scriptMatch[0];
    const scriptWithoutTags = scriptMatch[1];
  
    const codeToRun = `${scriptWithoutTags};function evExpr(expr){return eval(expr);}`;
    eval(codeToRun);

    evaluateExpr[filepath] = evExpr;
  
    const html = fileString.substr(scriptWithTags.length).trim();
  
    return parseHtml(html, filepath);
  }

  return fileString;

}

function parseHtml(html, filepath, evFunc = null) {

  let htmlToParse = html;
  let htmlParsed = '';

  let curlyBracesMatch;

  while (curlyBracesMatch = findCurlyBracesMatch(htmlToParse)){
    htmlParsed += htmlToParse.substring(0, curlyBracesMatch.startIndex);
    
    htmlToParse = htmlToParse.slice(curlyBracesMatch.endIndex+1);

    expression = curlyBracesMatch.expression.trim();
    
    if(
      ['#', ':'].includes(expression[0])
    ) {
      [ htmlToParse, htmlParsed ] = parseSpecialBlock(expression, htmlToParse, htmlParsed, filepath, evFunc);
    } else {
      htmlParsed += tryEval((evFunc || evaluateExpr[filepath]), expression, {expression, filepath});
    }
  }

  htmlParsed += htmlToParse;

  return htmlParsed;
}

function parseSpecialBlock(expression, htmlToParse, htmlParsed, filepath, evFunc = null) {
  const operator = expression.split(' ')[0].slice(1);

  if(!['if', 'each'].includes(operator)) throw new EsbeltoError(`Invalid operator '${operator}'`,{expression, filepath});

  const blockEnd = `{/${operator}}`;

  const codeBlockMatch = findCodeBlock(htmlToParse, operator);

  if(codeBlockMatch.endIndex === -1) throw new EsbeltoError(`Expected '${blockEnd}'`, {expression, filepath});

  const blockHtml = codeBlockMatch.html.trimStart();

  if(operator == 'if') htmlParsed += parseIfBlock(expression, blockHtml, filepath, evFunc);
  else if(operator == 'each') htmlParsed += parseEachBlock(expression, blockHtml, filepath, evFunc);

  htmlToParse = htmlToParse.slice(codeBlockMatch.endIndex+blockEnd.length).trimStart();

  return [ htmlToParse, htmlParsed ];
}

function parseIfBlock(expression, html, filepath, evFunc = null) {
  const elseIdx = html.indexOf('{:else');

  let ifHtml = html;
  let elseHtml = '';

  if(elseIdx !== -1) {
    ifHtml = html.substring(0, elseIdx).trimStart();
    const elseBlock = html.substring(elseIdx)

    const elseMatch = elseBlock.match(/{:(.*?)}/);
    const elseExpr = elseMatch[1]
    elseHtml = elseBlock.slice(elseMatch[0].length).trimStart();

    if(elseExpr.startsWith('else if')) {
      elseHtml = `{#${elseExpr.slice(5)}}` + elseHtml + `{/if}`;
    }

  }

  const condition = expression.slice(4);
  return parseHtml(tryEval((evFunc || evaluateExpr[filepath]), condition, {expression, filepath}) ? ifHtml : elseHtml, filepath);
}

function parseEachBlock(expression, html, filepath, evFunc = null) {

  const iterator = expression.slice(6).trim().split(' as ');

  let generatedHtml = '';

  const evalFuncs = tryEval((evFunc || evaluateExpr[filepath]), `eachEvalFuncs=[];${iterator[0]}.forEach((${iterator[1]}) => {
    function evExpr(expr){return eval(expr);}
    eachEvalFuncs.push(evExpr);
  }); eachEvalFuncs`, {expression, filepath});

  if(evalFuncs) {
    evalFuncs.forEach(evalFunc => {
      generatedHtml += parseHtml(html, filepath, evalFunc);    
    });
  }

  return generatedHtml;
}

function findCurlyBracesMatch(html) {
  let currentIdx = 0;
  let openBracesCount = 0;
  let closeBracesCount = 0;

  const openBraceIdx = html.indexOf('{', currentIdx);

  if(openBraceIdx === -1) return false;

  currentIdx = openBraceIdx + 1;
  openBracesCount += 1;

  let closeBraceIdx;

  while(1) {
    
    const nextOpenBraceIdx = html.indexOf('{', currentIdx);
    closeBraceIdx = html.indexOf('}', currentIdx);

    if(nextOpenBraceIdx === -1) {
      currentIdx = closeBraceIdx + 1;
      
      if(closeBraceIdx !== -1) {
        closeBracesCount += 1;
      }

    } else {
      currentIdx = Math.min(nextOpenBraceIdx, closeBraceIdx)+1;

      if(nextOpenBraceIdx < closeBraceIdx) {
        openBracesCount += 1;
      } else {
        closeBracesCount += 1;
      }
    }

    if(openBracesCount === closeBracesCount) {
      return {
        startIndex: openBraceIdx,
        endIndex: closeBraceIdx,
        expression: html.substring(openBraceIdx + 1, closeBraceIdx)
      }  
    }
  }
}

function findCodeBlock(html, operator) {

  let currentIdx = 0;
  let openTagsCount = 1;
  let closeTagsCount = 0;

  let closeBraceIdx;

  while(1) {
    
    const nextOpenBraceIdx = html.indexOf(`{#${operator}`, currentIdx);
    closeBraceIdx = html.indexOf(`{/${operator}}`, currentIdx);

    if(nextOpenBraceIdx === -1) {
      currentIdx = closeBraceIdx + 1;
      
      if(closeBraceIdx !== -1) {
        closeTagsCount += 1;
      }

    } else {
      currentIdx = Math.min(nextOpenBraceIdx, closeBraceIdx)+1;

      if(nextOpenBraceIdx < closeBraceIdx) {
        openTagsCount += 1;
      } else {
        closeTagsCount += 1;
      }
    }

    if(openTagsCount === closeTagsCount) {
      return {
        endIndex: closeBraceIdx,
        html: html.substring(0, closeBraceIdx)
      }
    }
  }
}

render.htmlStartTag = '<!DOCTYPE html>\n<html>\n';
render.htmlEndTag = '\n</html>';

module.exports = render;


