const EsbeltoError = require('./error');

function findMatch(html, filepath, currentIdx = 0, open = '{', close = '}') {
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

function findAllMatches(html, filepath, commonCallback, specialCallback, open = '{', close = '}') {
  let match;
  let htmlParsed = '';
  while(match = findMatch(html, filepath, 0, open, close)) {
    htmlParsed = html.substring(0, match.startIndex);
    if(match.expression[0] === '#') {
      html = html.slice(match.startIndex);
      let {blockContent, blockEndIdx} = parseSpecialBlock(match, html, filepath);
      html = html.slice(blockEndIdx);
      specialCallback(match, htmlParsed, blockContent);
    } else {
      html = html.slice(match.endIndex);
      commonCallback(match, htmlParsed);
    }
    
  }
  commonCallback(false, html, '');
}

function parseSpecialBlock(originalMatch, htmlToParse, filepath) {
  const operator = originalMatch.expression.split(' ')[0].slice(1);

  if(!['if', 'each'].includes(operator)) throw new EsbeltoError(`Invalid operator '#${operator}'`, {filepath, expression: originalMatch.expressionFull});

  const blockMatch = findMatch(htmlToParse, filepath, 0, `{#${operator}`, `{/${operator}}`);

  const blockContent = htmlToParse.substring(originalMatch.length, blockMatch.endInsideIndex).trimEnd();

  return {
    blockContent,
    blockEndIdx: blockMatch.endIndex
  }
}

function parseIfBlock(originalMatch, blockContent) {
  const blocks = [];
  let currentIdx = 0;

  let elseIdx = -originalMatch.length;
  let elseMatch = originalMatch;

  while(true) {
    const indexOfNextIf = blockContent.indexOf('{#if', currentIdx);

    if(indexOfNextIf !== -1) {
      currentIdx = blockContent.indexOf('{/if}', currentIdx);
      if(currentIdx === -1) throw new EsbeltoError('Expected {/if}', {filepath, expression: blockContent.substring(indexOfNextIf, 10)});
    }

    const nextElseIdx = blockContent.indexOf('{:else', currentIdx);
    
    let type, condition;
    if(elseMatch.expression.startsWith('#if')) {
      type = 'if';
      condition = elseMatch.expression.slice(4);
    } else if(elseMatch.expression.startsWith(':else if')) {
      type = 'else if';
      condition = elseMatch.expression.slice(9);
    } else {
      type = 'else';
      condition = false;
    }

    blocks.push({
      type: type,
      condition: condition,
      content: nextElseIdx === -1 ? 
        blockContent.slice(elseIdx + elseMatch.length) : 
        blockContent.substring(elseIdx + elseMatch.length, nextElseIdx)
    });

    
    if(nextElseIdx === -1) break;

    elseIdx = nextElseIdx;
    elseMatch = findMatch(blockContent.slice(elseIdx));  
    currentIdx = elseMatch.endIndex + elseIdx;

  }

  return blocks;

}

module.exports = {
  findMatch,
  findAllMatches,
  parseIfBlock
}