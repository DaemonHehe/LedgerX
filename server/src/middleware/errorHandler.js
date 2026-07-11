export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url} - `, err);

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An internal server error occurred.' 
    : err.message || 'An internal server error occurred.';

  // Suppress details in production to protect system information
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
