class AppError extends Error { //opeational errors are created here
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';//transforms statusCode into string and
                                                                     // in case it starts with 4, it returns
                                                                     //'fail', otherwise, it returns 'error'

    this.isOperational = true;
    console.log(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
