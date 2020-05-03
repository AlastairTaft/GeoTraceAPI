/**
 * @class
 * An error with status code information.
 */
class ServerError extends Error {
  /**
   * @param {string} message
   * @param {string|number} statusCode 
   * @param {string} errorCode 
   */
  constructor(message, statusCode, errorCode) {
    super(message)
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

module.exports = {
  ServerError,
}
