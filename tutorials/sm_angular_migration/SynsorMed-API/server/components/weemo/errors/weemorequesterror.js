/**
 * `WeemoRequestError` error.
 *
 * @api public
 */
function WeemoRequestError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'WeemoRequestError';
  this.message = message || null;
};

/**
 * Inherit from `Error`.
 */
WeemoRequestError.prototype.__proto__ = Error.prototype;


/**
 * Expose `WeemoRequestError`.
 */
module.exports = WeemoRequestError;
