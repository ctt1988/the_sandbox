/**
 * Error responses
 */

'use strict';

function HTTPNotFoundError(message) {
  this.message = message;
  this.name = "HTTPNotFoundError";
  Error.captureStackTrace(this, HTTPNotFoundError);
}
HTTPNotFoundError.prototype = Object.create(Error.prototype);

function SecurityError(message) {
  this.message = message;
  this.name = "SecurityError";
  Error.captureStackTrace(this, SecurityError);
}
SecurityError.prototype = Object.create(Error.prototype);

function SQLExceptionError(message) {
  this.message = message;
  this.name = "SQLExceptionError";
  Error.captureStackTrace(this, SQLExceptionError);
}
SQLExceptionError.prototype = Object.create(Error.prototype);

function BadRequestError(message) {
  this.message = message;
  this.name = "BadRequestError";
  Error.captureStackTrace(this, SQLExceptionError);
}
BadRequestError.prototype = Object.create(Error.prototype);

function ValidationError(message) {
  this.message = message;
  this.name = "ValidationError";
  Error.captureStackTrace(this, SQLExceptionError);
}
ValidationError.prototype = Object.create(Error.prototype);

module.exports = {
  HTTPNotFoundError: HTTPNotFoundError,
  BadRequestError: BadRequestError,
  SecurityError: SecurityError,
  SQLExceptionError: SQLExceptionError,
  ValidationError: ValidationError
}
