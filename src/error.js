class EsbeltoError extends Error {
  constructor(message, stack) {
    super();

    this.message = `${message}\n`;
    if(stack.expression) {
      this.message += ` in expression '${stack.expression}'\n`;
    }
    if(stack.after) {
      this.message += ` after '${stack.after}'\n`;
    }
    this.message += ` at '${stack.filepath}'`;

    this.name = "EsbeltoError";
  }
}

module.exports = EsbeltoError;