/**
 * Logger Service
 * Centralized logging with Winston
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class Logger {
    constructor() {
        this.logger = this.createLogger();
    }

    createLogger() {
        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Define log format
        const logFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.json()
        );

        // Define transports
        const transports = [
            // Console transport
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info',
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }),

            // File transport for all logs
            new winston.transports.File({
                filename: path.join(logsDir, 'combined.log'),
                level: 'info',
                format: logFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            }),

            // File transport for errors only
            new winston.transports.File({
                filename: path.join(logsDir, 'error.log'),
                level: 'error',
                format: logFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            })
        ];

        // Create logger
        return winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports,
            exitOnError: false
        });
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    verbose(message, meta = {}) {
        this.logger.verbose(message, meta);
    }

    // Structured logging methods
    logRequest(req, res, duration) {
        this.info('HTTP Request', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }

    logError(error, context = {}) {
        this.error('Application Error', {
            message: error.message,
            stack: error.stack,
            ...context
        });
    }

    logAudioProcessing(operation, file, duration, result = {}) {
        this.info('Audio Processing', {
            operation,
            file: file.originalname || file,
            size: file.size,
            duration: `${duration}ms`,
            ...result
        });
    }

    logAPIUsage(api, endpoint, duration, success = true) {
        this.info('API Usage', {
            api,
            endpoint,
            duration: `${duration}ms`,
            success
        });
    }
}

module.exports = Logger;
