const evaluator = require('./evaluator');
const EsbeltoError = require('./error');

function parseHtml(html, filepath, evFunc) {
  let htmlToParse = html;
  let htmlParsed = '';

  let match;

  while(match = findMatch(htmlToParse, filepath)) {

    htmlParsed += htmlToParse.substring(0, match.startIndex);

    if(match.expression[0] === '#') {
      htmlToParse = htmlToParse.slice(match.startIndex);
      ({htmlParsed, htmlToParse} = parseSpecialBlock(htmlParsed, htmlToParse, match, filepath, evFunc));
    } else {
      htmlToParse = htmlToParse.slice(match.endIndex);
      htmlParsed += evaluator.tryEval(evFunc, match.expression, {filepath, expression: match.expressionFull});
    }

  }

  htmlParsed += htmlToParse;
  
  return htmlParsed;

}

function parseSpecialBlock(htmlParsed, htmlToParse, originalMatch, filepath, evFunc) {
  const operator = originalMatch.expression.split(' ')[0].slice(1);

  if(!['if', 'each'].includes(operator)) throw new EsbeltoError(`Invalid operator '#${operator}'`, {filepath, expression: originalMatch.expressionFull});

  const blockMatch = findMatch(htmlToParse, filepath, `{#${operator}`, `{/${operator}}`);

  const blockContent = htmlToParse.substring(originalMatch.length, blockMatch.endInsideIndex).trimEnd();

  let parsedFromBlock;

  if(operator === 'if'){
    parsedFromBlock = parseIfBlock(originalMatch, blockContent, filepath, evFunc);
  } else if (operator === 'each') {
    parsedFromBlock = parseEachBlock(originalMatch, blockContent, filepath, evFunc);
  }

  htmlParsed = htmlParsed.trim();
  htmlParsed += parsedFromBlock;
  htmlToParse = htmlToParse.slice(blockMatch.endIndex);

  return {htmlParsed, htmlToParse};
}

function parseIfBlock(match, blockContent, filepath, evFunc) {
  const condition = match.expression.slice(3).trim();

  const elseIdx = blockContent.indexOf('{:else');

  let ifContent = blockContent;
  let elseContent = '';

  if(elseIdx !== -1) {
    ifContent = blockContent.substring(0, elseIdx);

    const elseBlock = blockContent.substring(elseIdx)
    const elseMatch = findMatch(elseBlock);
    const elseExpr = elseMatch.expression.slice(1);

    elseContent = elseBlock.slice(elseMatch.length);

    if(elseExpr.startsWith('else if')) {
      elseContent = `{#${elseExpr.slice(5)}}` + elseContent + `{/if}`;
    }
  }

  const result = evaluator.tryEval(evFunc, condition, {filepath, expression: match.expressionFull})
  const contentToParse = result ? ifContent : elseContent;
  return parseHtml(contentToParse.trimEnd(), filepath, evFunc);

}

function parseEachBlock(match, blockContent, filepath, evFunc) {
  const iterator = match.expression.slice(6).trim().split(' as ');

  let generatedHtml = '';

  const evalFuncs = evaluator.tryEval(evFunc,
  `eachEvalFuncs=[];${iterator[0]}.forEach((${iterator[1]}) => {
    function evExpr(expr){return eval(expr);}
    eachEvalFuncs.push(evExpr);
  }); eachEvalFuncs`, {filepath, expression: match.expressionFull});

  evalFuncs.forEach(evalFunc => {
    generatedHtml += parseHtml(blockContent, filepath, evalFunc);    
  });

  return generatedHtml.trimEnd();
}

function findMatch(html, filepath, open = '{', close = '}') {
  let currentIdx = 0;
  let openCount = 0;
  let closeCount = 0;

  const openIdx = html.indexOf(open, currentIdx);

  if(openIdx === -1) return false;

  currentIdx = openIdx + 1;
  openCount += 1;

  let closeIdx;

  while(1) {
    
    const nextOpenIdx = html.indexOf(open, currentIdx);

    closeIdx = html.indexOf(close, currentIdx);

    if(closeIdx === -1) throw new EsbeltoError(`Expected ${close}`, {filepath, after: html.substring(openIdx, openIdx+20)});

    if(nextOpenIdx === -1) {
      currentIdx = closeIdx + 1;
      closeCount += 1;
    } else {
      currentIdx = Math.min(nextOpenIdx, closeIdx)+1;

      if(nextOpenIdx < closeIdx) {
        openCount += 1;
      } else {
        closeCount += 1;
      }
    }

    if(openCount === closeCount) {
      return {
        startIndex: openIdx,
        endIndex: closeIdx + close.length,
        endInsideIndex: closeIdx,
        length: closeIdx - openIdx + close.length,
        expression: html.substring(openIdx + open.length, closeIdx).trim(),
        expressionFull: html.substring(openIdx, closeIdx + close.length).trim()
      }  
    }
  }
}

module.exports = {
  parseHtml,
  findMatch
}