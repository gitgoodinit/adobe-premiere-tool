/**
 * Cache Service
 * Handles caching of analysis results and temporary data
 */

const NodeCache = require('node-cache');
const Logger = require('./Logger');

class CacheService {
    constructor() {
        this.logger = new Logger();
        this.cache = new NodeCache({
            stdTTL: 3600, // 1 hour default TTL
            checkperiod: 600, // Check for expired keys every 10 minutes
            useClones: false // Don't clone objects for better performance
        });
        
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.logger.info('Initializing Cache Service...');
            
            // Set up cache event listeners
            this.cache.on('set', (key, value) => {
                this.logger.debug(`Cache set: ${key}`);
            });

            this.cache.on('del', (key, value) => {
                this.logger.debug(`Cache deleted: ${key}`);
            });

            this.cache.on('expired', (key, value) => {
                this.logger.debug(`Cache expired: ${key}`);
            });

            this.isInitialized = true;
            this.logger.info('Cache Service initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Cache Service:', error);
            throw error;
        }
    }

    // Basic cache operations
    set(key, value, ttl = null) {
        try {
            if (ttl) {
                this.cache.set(key, value, ttl);
            } else {
                this.cache.set(key, value);
            }
            return true;
        } catch (error) {
            this.logger.error(`Failed to set cache key ${key}:`, error);
            return false;
        }
    }

    get(key) {
        try {
            return this.cache.get(key);
        } catch (error) {
            this.logger.error(`Failed to get cache key ${key}:`, error);
            return undefined;
        }
    }

    del(key) {
        try {
            return this.cache.del(key);
        } catch (error) {
            this.logger.error(`Failed to delete cache key ${key}:`, error);
            return false;
        }
    }

    has(key) {
        return this.cache.has(key);
    }

    // Audio analysis specific cache methods
    cacheSilenceAnalysis(fileHash, analysisResults, ttl = 3600) {
        const key = `silence:${fileHash}`;
        return this.set(key, {
            results: analysisResults,
            timestamp: Date.now(),
            type: 'silence_analysis'
        }, ttl);
    }

    getSilenceAnalysis(fileHash) {
        const key = `silence:${fileHash}`;
        const cached = this.get(key);
        return cached ? cached.results : null;
    }

    cacheOverlapAnalysis(fileHashes, analysisResults, ttl = 3600) {
        const key = `overlap:${fileHashes.sort().join(':')}`;
        return this.set(key, {
            results: analysisResults,
            timestamp: Date.now(),
            type: 'overlap_analysis'
        }, ttl);
    }

    getOverlapAnalysis(fileHashes) {
        const key = `overlap:${fileHashes.sort().join(':')}`;
        const cached = this.get(key);
        return cached ? cached.results : null;
    }

    cacheRhythmAnalysis(fileHash, analysisResults, ttl = 3600) {
        const key = `rhythm:${fileHash}`;
        return this.set(key, {
            results: analysisResults,
            timestamp: Date.now(),
            type: 'rhythm_analysis'
        }, ttl);
    }

    getRhythmAnalysis(fileHash) {
        const key = `rhythm:${fileHash}`;
        const cached = this.get(key);
        return cached ? cached.results : null;
    }

    cacheMultiTrackAnalysis(fileHashes, analysisResults, ttl = 3600) {
        const key = `multitrack:${fileHashes.sort().join(':')}`;
        return this.set(key, {
            results: analysisResults,
            timestamp: Date.now(),
            type: 'multitrack_analysis'
        }, ttl);
    }

    getMultiTrackAnalysis(fileHashes) {
        const key = `multitrack:${fileHashes.sort().join(':')}`;
        const cached = this.get(key);
        return cached ? cached.results : null;
    }

    // Job status caching
    cacheJobStatus(jobId, status, ttl = 1800) { // 30 minutes
        const key = `job:${jobId}`;
        return this.set(key, {
            status,
            timestamp: Date.now(),
            type: 'job_status'
        }, ttl);
    }

    getJobStatus(jobId) {
        const key = `job:${jobId}`;
        const cached = this.get(key);
        return cached ? cached.status : null;
    }

    // Settings caching
    cacheSettings(settings, ttl = 7200) { // 2 hours
        return this.set('settings', {
            settings,
            timestamp: Date.now(),
            type: 'settings'
        }, ttl);
    }

    getSettings() {
        const cached = this.get('settings');
        return cached ? cached.settings : null;
    }

    // API response caching
    cacheAPIResponse(endpoint, params, response, ttl = 1800) { // 30 minutes
        const key = `api:${endpoint}:${JSON.stringify(params)}`;
        return this.set(key, {
            response,
            timestamp: Date.now(),
            type: 'api_response'
        }, ttl);
    }

    getAPIResponse(endpoint, params) {
        const key = `api:${endpoint}:${JSON.stringify(params)}`;
        const cached = this.get(key);
        return cached ? cached.response : null;
    }

    // File hash caching
    cacheFileHash(filePath, hash, ttl = 86400) { // 24 hours
        const key = `filehash:${filePath}`;
        return this.set(key, {
            hash,
            timestamp: Date.now(),
            type: 'file_hash'
        }, ttl);
    }

    getFileHash(filePath) {
        const key = `filehash:${filePath}`;
        const cached = this.get(key);
        return cached ? cached.hash : null;
    }

    // Cache statistics
    getStats() {
        return {
            keys: this.cache.keys().length,
            hits: this.cache.getStats().hits,
            misses: this.cache.getStats().misses,
            ksize: this.cache.getStats().ksize,
            vsize: this.cache.getStats().vsize
        };
    }

    // Cache management
    clear() {
        this.cache.flushAll();
        this.logger.info('Cache cleared');
    }

    clearByPattern(pattern) {
        const keys = this.cache.keys();
        const regex = new RegExp(pattern);
        let cleared = 0;

        keys.forEach(key => {
            if (regex.test(key)) {
                this.cache.del(key);
                cleared++;
            }
        });

        this.logger.info(`Cleared ${cleared} cache entries matching pattern: ${pattern}`);
        return cleared;
    }

    clearExpired() {
        this.cache.flushAll();
        this.logger.info('Expired cache entries cleared');
    }

    // Cache health check
    isHealthy() {
        try {
            // Test basic operations
            const testKey = 'health_check';
            const testValue = { test: true, timestamp: Date.now() };
            
            this.set(testKey, testValue, 10);
            const retrieved = this.get(testKey);
            this.del(testKey);
            
            return retrieved && retrieved.test === true;
        } catch (error) {
            this.logger.error('Cache health check failed:', error);
            return false;
        }
    }

    // Cleanup
    async cleanup() {
        try {
            this.logger.info('Cleaning up Cache Service...');
            
            // Clear all cache entries
            this.clear();
            
            // Close cache
            this.cache.close();
            
            this.isInitialized = false;
            this.logger.info('Cache Service cleanup completed');
            
        } catch (error) {
            this.logger.error('Cache Service cleanup failed:', error);
        }
    }
}

module.exports = CacheService;
