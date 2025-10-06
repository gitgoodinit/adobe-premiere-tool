/**
 * Global Error Handler Middleware
 * Handles all unhandled errors and provides consistent error responses
 */

function errorHandler(err, req, res, next) {
    // Log the error
    console.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        details = err.details || err.message;
    } else if (err.name === 'MulterError') {
        statusCode = 400;
        message = 'File Upload Error';
        details = err.message;
    } else if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'File Too Large';
        details = 'File size exceeds the maximum allowed limit';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
        statusCode = 400;
        message = 'Too Many Files';
        details = 'Number of files exceeds the maximum allowed limit';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected File Field';
        details = 'Unexpected file field in request';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid Data Type';
        details = 'Invalid data type provided';
    } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON';
        details = 'Request body contains invalid JSON';
    } else if (err.status || err.statusCode) {
        statusCode = err.status || err.statusCode;
        message = err.message || 'Error';
        details = err.details;
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        details = null;
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            details,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || null
        }
    });
}

module.exports = errorHandler;