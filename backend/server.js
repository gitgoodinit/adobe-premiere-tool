/**
 * Audio Tools Pro Backend Server
 * Express.js API server for Adobe Premiere Pro Audio Plugin
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import route modules
const silenceRoutes = require('./routes/silence');
const overlapRoutes = require('./routes/overlap');
const multitrackRoutes = require('./routes/multitrack');
const rhythmRoutes = require('./routes/rhythm');
const settingsRoutes = require('./routes/settings');
const healthRoutes = require('./routes/health');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const validation = require('./middleware/validation');

// Import services
const AudioProcessor = require('./services/AudioProcessor');
const CacheService = require('./services/CacheService');
const Logger = require('./services/Logger');

class AudioToolsBackend {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.audioProcessor = new AudioProcessor();
        this.cache = new CacheService();
        this.logger = new Logger();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);

        // Compression
        this.app.use(compression());

        // Logging
        this.app.use(morgan('combined', {
            stream: {
                write: (message) => this.logger.info(message.trim())
            }
        }));

        // Request logging middleware
        this.app.use(requestLogger);

        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Static files
        this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
        this.app.use('/temp', express.static(path.join(__dirname, 'temp')));

        // Create necessary directories
        this.createDirectories();
    }

    setupRoutes() {
        // Health check
        this.app.use('/api/health', healthRoutes);

        // API routes
        this.app.use('/api/silence', silenceRoutes);
        this.app.use('/api/overlap', overlapRoutes);
        this.app.use('/api/multitrack', multitrackRoutes);
        this.app.use('/api/rhythm', rhythmRoutes);
        this.app.use('/api/settings', settingsRoutes);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: 'Audio Tools Pro Backend API',
                version: '1.0.0',
                description: 'Backend API for Adobe Premiere Pro Audio Plugin',
                endpoints: {
                    health: '/api/health',
                    silence: '/api/silence',
                    overlap: '/api/overlap',
                    multitrack: '/api/multitrack',
                    rhythm: '/api/rhythm',
                    settings: '/api/settings'
                },
                documentation: '/api/docs'
            });
        });

        // API documentation endpoint
        this.app.get('/api/docs', (req, res) => {
            res.json({
                title: 'Audio Tools Pro API Documentation',
                version: '1.0.0',
                baseUrl: `${req.protocol}://${req.get('host')}/api`,
                endpoints: {
                    silence: {
                        'POST /detect': 'Detect silence in audio file',
                        'POST /trim': 'Trim silence from audio file',
                        'GET /methods': 'Get available detection methods'
                    },
                    overlap: {
                        'POST /detect': 'Detect audio overlaps',
                        'POST /resolve': 'Resolve detected overlaps',
                        'GET /algorithms': 'Get available detection algorithms'
                    },
                    multitrack: {
                        'POST /analyze': 'Analyze multiple audio tracks',
                        'POST /sync': 'Sync multiple tracks',
                        'POST /ducking': 'Configure dynamic ducking'
                    },
                    rhythm: {
                        'POST /analyze': 'Analyze rhythm and timing',
                        'POST /correct': 'Apply timing corrections',
                        'GET /algorithms': 'Get available correction algorithms'
                    },
                    settings: {
                        'GET /': 'Get current settings',
                        'PUT /': 'Update settings',
                        'POST /export': 'Export configuration',
                        'POST /import': 'Import configuration'
                    }
                }
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method,
                availableEndpoints: '/api/docs'
            });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    createDirectories() {
        const dirs = ['uploads', 'temp', 'cache', 'logs'];
        dirs.forEach(dir => {
            const dirPath = path.join(__dirname, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                this.logger.info(`Created directory: ${dirPath}`);
            }
        });
    }

    async start() {
        try {
            // Initialize services
            await this.audioProcessor.initialize();
            await this.cache.initialize();

            // Start server
            this.app.listen(this.port, () => {
                this.logger.info(`🚀 Audio Tools Pro Backend Server running on port ${this.port}`);
                this.logger.info(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
                this.logger.info(`🏥 Health Check: http://localhost:${this.port}/api/health`);
            });

            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

        } catch (error) {
            this.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        this.logger.info('🛑 Shutting down server...');
        
        try {
            await this.audioProcessor.cleanup();
            await this.cache.cleanup();
            this.logger.info('✅ Server shutdown complete');
            process.exit(0);
        } catch (error) {
            this.logger.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new AudioToolsBackend();
    server.start();
}

module.exports = AudioToolsBackend;
