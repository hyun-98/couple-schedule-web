const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, _next) {
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid resource id',
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      status: 'fail',
      message: `${field} already exists`,
    });
  }

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const isOperational = err instanceof AppError || err.name === 'ValidationError';

  if (statusCode === 500 && !isOperational) {
    console.error(err);
  }

  const message =
    err.name === 'ValidationError'
      ? Object.values(err.errors || {})
          .map((e) => e.message)
          .join(', ') || 'Validation failed'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  });
}

module.exports = { notFoundHandler, errorHandler };
