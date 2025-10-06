/**
 * Health Controller
 * Handles health check and system status requests
 */

const Logger = require('../../utils/logger');

class HealthController {
    constructor() {
        this.logger = new Logger();
    }

    /**
     * Basic health check endpoint
     */
    getHealth(req, res) {
        try {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: {
                    seconds: Math.floor(uptime),
                    formatted: this.formatUptime(uptime)
                },
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
                    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
                    unit: 'MB'
                },
                system: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    pid: process.pid
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }

    /**
     * Detailed health check with service status
     */
    getDetailedHealth(req, res) {
        try {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            // Mock service health checks
            const services = {
                ffmpeg: {
                    status: 'healthy',
                    available: true,
                    version: '4.4.0',
                    lastCheck: new Date().toISOString()
                },
                cache: {
                    status: 'healthy',
                    available: true,
                    entries: Math.floor(Math.random() * 100),
                    hitRate: (Math.random() * 0.3 + 0.7).toFixed(2)
                },
                storage: {
                    status: 'healthy',
                    available: true,
                    freeSpace: Math.floor(Math.random() * 50 + 10) + 'GB',
                    usedSpace: Math.floor(Math.random() * 30 + 5) + 'GB'
                },
                database: {
                    status: 'n/a',
                    available: false,
                    message: 'No database configured'
                }
            };

            const overallHealth = Object.values(services).every(
                service => service.status === 'healthy' || service.status === 'n/a'
            );

            res.json({
                status: overallHealth ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                uptime: {
                    seconds: Math.floor(uptime),
                    formatted: this.formatUptime(uptime)
                },
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
                    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
                    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
                    unit: 'MB'
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                system: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    pid: process.pid,
                    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
                },
                services
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }

    /**
     * Get API endpoints information
     */
    getApiInfo(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get('host')}/api`;
            
            res.json({
                name: 'Audio Tools Pro Backend API',
                version: '1.0.0',
                description: 'Backend API for Adobe Premiere Pro Audio Plugin',
                baseUrl,
                endpoints: {
                    health: {
                        'GET /health': 'Basic health check',
                        'GET /health/detailed': 'Detailed health check with service status'
                    },
                    silence: {
                        'POST /silence/detect': 'Detect silence in audio file',
                        'POST /silence/trim': 'Trim silence from audio file',
                        'POST /silence/batch': 'Process multiple files for silence detection',
                        'GET /silence/methods': 'Get available detection methods',
                        'GET /silence/status/:requestId': 'Get job status'
                    },
                    overlap: {
                        'POST /overlap/detect': 'Detect audio overlaps',
                        'POST /overlap/resolve': 'Resolve detected overlaps',
                        'GET /overlap/algorithms': 'Get available detection algorithms',
                        'GET /overlap/status/:requestId': 'Get job status'
                    },
                    rhythm: {
                        'POST /rhythm/analyze': 'Analyze rhythm and timing',
                        'POST /rhythm/correct': 'Apply timing corrections',
                        'GET /rhythm/algorithms': 'Get available correction algorithms',
                        'GET /rhythm/status/:requestId': 'Get job status'
                    },
                    settings: {
                        'GET /settings': 'Get current settings',
                        'PUT /settings': 'Update settings',
                        'POST /settings/export': 'Export configuration',
                        'POST /settings/import': 'Import configuration',
                        'POST /settings/reset': 'Reset to defaults',
                        'GET /settings/schema': 'Get settings schema'
                    }
                },
                documentation: `${baseUrl}/docs`,
                supportedFormats: {
                    input: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'],
                    output: ['mp3', 'wav', 'm4a', 'ogg']
                },
                limits: {
                    maxFileSize: '100MB',
                    maxFilesPerRequest: 10,
                    rateLimit: '100 requests per 15 minutes'
                }
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get API information',
                message: error.message
            });
        }
    }

    /**
     * Get system metrics
     */
    getMetrics(req, res) {
        try {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            
            // Generate mock metrics
            const metrics = {
                timestamp: new Date().toISOString(),
                uptime: Math.floor(uptime),
                requests: {
                    total: Math.floor(Math.random() * 10000 + 1000),
                    success: Math.floor(Math.random() * 9000 + 900),
                    errors: Math.floor(Math.random() * 100 + 10),
                    rate: (Math.random() * 50 + 10).toFixed(1) + ' req/min'
                },
                processing: {
                    silenceDetections: Math.floor(Math.random() * 500 + 50),
                    overlapDetections: Math.floor(Math.random() * 200 + 20),
                    rhythmAnalyses: Math.floor(Math.random() * 300 + 30),
                    averageProcessingTime: (Math.random() * 2000 + 500).toFixed(0) + 'ms'
                },
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
                    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
                    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100
                },
                cache: {
                    hits: Math.floor(Math.random() * 1000 + 100),
                    misses: Math.floor(Math.random() * 200 + 20),
                    hitRate: (Math.random() * 0.3 + 0.65).toFixed(3),
                    entries: Math.floor(Math.random() * 100 + 10)
                }
            };

            res.json({
                success: true,
                metrics
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get system metrics',
                message: error.message
            });
        }
    }

    /**
     * Format uptime in human readable format
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0) parts.push(`${secs}s`);

        return parts.join(' ') || '0s';
    }
}

module.exports = HealthController;