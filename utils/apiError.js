// @desc  this class is responsible about operation errors (errors that i can predict)
class ApiError extends Error {
  constructor(message, statuscode) {
    super(message);
    this.statuscode = statuscode;
    this.status = `${statuscode}`.startsWith(4) ? "fail" : "error";
    this.isOperational = true;
  }
}

// Sets the status property based on the status code. If the status code starts with 4 (indicating a client error)
// The isOperational property is set to true, indicating that this error is expected and handled within the application.

module.exports = ApiError;
