/**
 * Cache Service
 * Handles caching of analysis results and temporary data
 */

const NodeCache = require('node-cache');

class CacheService {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 3600, // 1 hour default TTL
            checkperiod: 600, // Check for expired keys every 10 minutes
            useClones: false // Don't clone objects for better performance
        });
        
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Set up cache event listeners
            this.cache.on('set', (key, value) => {
                console.log(`Cache set: ${key}`);
            });

            this.cache.on('del', (key, value) => {
                console.log(`Cache deleted: ${key}`);
            });

            this.cache.on('expired', (key, value) => {
                console.log(`Cache expired: ${key}`);
            });

            this.isInitialized = true;
            
        } catch (error) {
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
            return false;
        }
    }

    get(key) {
        try {
            return this.cache.get(key);
        } catch (error) {
            return undefined;
        }
    }

    del(key) {
        try {
            return this.cache.del(key);
        } catch (error) {
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

        return cleared;
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
            return false;
        }
    }

    // Cleanup
    async cleanup() {
        try {
            this.clear();
            this.cache.close();
            this.isInitialized = false;
        } catch (error) {
            // Silent cleanup
        }
    }
}

module.exports = CacheService;