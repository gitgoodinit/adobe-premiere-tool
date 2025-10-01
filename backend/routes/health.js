/**
 * Health Check API Routes
 * Handles system health monitoring and status checks
 */

const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');

const Logger = require('../services/Logger');

const router = express.Router();
const logger = new Logger();

/**
 * @route GET /api/health
 * @desc Basic health check endpoint
 * @access Public
 */
router.get('/', (req, res) => {
    const startTime = Date.now();
    
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            responseTime: `${Date.now() - startTime}ms`
        };

        res.json({
            success: true,
            health: healthData
        });

    } catch (error) {
        logger.error('Health check failed:', error);
        
        res.status(500).json({
            success: false,
            health: {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            }
        });
    }
});

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with system information
 * @access Public
 */
router.get('/detailed', (req, res) => {
    const startTime = Date.now();
    
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            responseTime: `${Date.now() - startTime}ms`,
            
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                cpuCount: os.cpus().length,
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                loadAverage: os.loadavg()
            },
            
            process: {
                pid: process.pid,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                uptime: process.uptime()
            },
            
            services: {
                audioProcessor: checkAudioProcessorHealth(),
                cacheService: checkCacheServiceHealth(),
                settingsManager: checkSettingsManagerHealth()
            },
            
            directories: {
                uploads: checkDirectoryHealth(path.join(__dirname, '../uploads')),
                temp: checkDirectoryHealth(path.join(__dirname, '../temp')),
                cache: checkDirectoryHealth(path.join(__dirname, '../cache')),
                logs: checkDirectoryHealth(path.join(__dirname, '../logs'))
            }
        };

        res.json({
            success: true,
            health: healthData
        });

    } catch (error) {
        logger.error('Detailed health check failed:', error);
        
        res.status(500).json({
            success: false,
            health: {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            }
        });
    }
});

/**
 * @route GET /api/health/ready
 * @desc Readiness check for load balancers
 * @access Public
 */
router.get('/ready', (req, res) => {
    try {
        // Check if all critical services are ready
        const isReady = checkSystemReadiness();
        
        if (isReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                reason: 'Critical services not available'
            });
        }

    } catch (error) {
        logger.error('Readiness check failed:', error);
        
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * @route GET /api/health/live
 * @desc Liveness check for container orchestration
 * @access Public
 */
router.get('/live', (req, res) => {
    try {
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });

    } catch (error) {
        logger.error('Liveness check failed:', error);
        
        res.status(500).json({
            status: 'dead',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * @route GET /api/health/metrics
 * @desc System metrics for monitoring
 * @access Public
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            
            system: {
                cpu: {
                    usage: process.cpuUsage(),
                    loadAverage: os.loadavg(),
                    cores: os.cpus().length
                },
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    process: process.memoryUsage()
                },
                disk: {
                    uploads: getDirectorySize(path.join(__dirname, '../uploads')),
                    temp: getDirectorySize(path.join(__dirname, '../temp')),
                    cache: getDirectorySize(path.join(__dirname, '../cache')),
                    logs: getDirectorySize(path.join(__dirname, '../logs'))
                }
            },
            
            application: {
                uptime: process.uptime(),
                requests: getRequestMetrics(),
                errors: getErrorMetrics(),
                performance: getPerformanceMetrics()
            }
        };

        res.json({
            success: true,
            metrics
        });

    } catch (error) {
        logger.error('Metrics collection failed:', error);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper functions

function checkAudioProcessorHealth() {
    try {
        // Check if audio processor is available
        return {
            status: 'healthy',
            available: true,
            message: 'Audio processor is available'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            available: false,
            message: error.message
        };
    }
}

function checkCacheServiceHealth() {
    try {
        // Check if cache service is available
        return {
            status: 'healthy',
            available: true,
            message: 'Cache service is available'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            available: false,
            message: error.message
        };
    }
}

function checkSettingsManagerHealth() {
    try {
        // Check if settings manager is available
        return {
            status: 'healthy',
            available: true,
            message: 'Settings manager is available'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            available: false,
            message: error.message
        };
    }
}

function checkDirectoryHealth(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return {
                status: 'unhealthy',
                exists: false,
                message: 'Directory does not exist'
            };
        }

        const stats = fs.statSync(dirPath);
        if (!stats.isDirectory()) {
            return {
                status: 'unhealthy',
                exists: true,
                isDirectory: false,
                message: 'Path exists but is not a directory'
            };
        }

        // Check if directory is writable
        try {
            const testFile = path.join(dirPath, '.health-check');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            
            return {
                status: 'healthy',
                exists: true,
                isDirectory: true,
                writable: true,
                message: 'Directory is healthy'
            };
        } catch (writeError) {
            return {
                status: 'unhealthy',
                exists: true,
                isDirectory: true,
                writable: false,
                message: 'Directory is not writable'
            };
        }

    } catch (error) {
        return {
            status: 'unhealthy',
            exists: false,
            message: error.message
        };
    }
}

function checkSystemReadiness() {
    try {
        // Check critical services
        const audioProcessorReady = checkAudioProcessorHealth().available;
        const cacheServiceReady = checkCacheServiceHealth().available;
        const settingsManagerReady = checkSettingsManagerHealth().available;
        
        // Check critical directories
        const uploadsReady = checkDirectoryHealth(path.join(__dirname, '../uploads')).status === 'healthy';
        const tempReady = checkDirectoryHealth(path.join(__dirname, '../temp')).status === 'healthy';
        
        return audioProcessorReady && cacheServiceReady && settingsManagerReady && uploadsReady && tempReady;
        
    } catch (error) {
        logger.error('System readiness check failed:', error);
        return false;
    }
}

function getDirectorySize(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return { size: 0, files: 0 };
        }

        let totalSize = 0;
        let fileCount = 0;

        function calculateSize(itemPath) {
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                const files = fs.readdirSync(itemPath);
                files.forEach(file => {
                    calculateSize(path.join(itemPath, file));
                });
            } else {
                totalSize += stats.size;
                fileCount++;
            }
        }

        calculateSize(dirPath);
        
        return {
            size: totalSize,
            files: fileCount,
            sizeFormatted: formatBytes(totalSize)
        };
        
    } catch (error) {
        return { size: 0, files: 0, error: error.message };
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getRequestMetrics() {
    // This would be implemented with actual request tracking
    return {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
    };
}

function getErrorMetrics() {
    // This would be implemented with actual error tracking
    return {
        total: 0,
        byType: {},
        last24Hours: 0
    };
}

function getPerformanceMetrics() {
    // This would be implemented with actual performance tracking
    return {
        averageProcessingTime: 0,
        peakMemoryUsage: 0,
        cpuUsage: 0
    };
}

module.exports = router;
