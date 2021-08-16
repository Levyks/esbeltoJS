const EsbeltoError = require('./error');

function evaluateScriptBlock (code, renderer) {

  function getVariables() {return renderer.options;}
  function getInclude() {return (relpath, options) => {return renderer.include(relpath, options)};}
  function getIncludeScript() {return renderer.includeScript;}

  try {
    return eval(`${code};e=>{return eval(e)}`);
  } catch(e) {
    throw new EsbeltoError(e.message, {filepath: renderer.filepath, expression: "Esbelto's <script> tag"})
  }

}

function tryEval(evalFunc, expression, customStack) {
  try {
    return evalFunc(expression);
  } catch (e) {
    throw new EsbeltoError(e.message, customStack);
  }
}

module.exports = {
  evaluateScriptBlock,
  tryEval
}