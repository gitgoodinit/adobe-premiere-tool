/**
 * Environment Configuration
 * Centralized configuration for backend URLs and environment settings
 */

class EnvironmentConfig {
    constructor() {
        this.config = this.loadConfiguration();
    }

    loadConfiguration() {
        // Default configuration
        const defaultConfig = {
            backend: {
                host: 'localhost',
                defaultPort: 3000,
                maxPort: 3010,
                protocol: 'http',
                apiPath: '/api'
            },
            environment: 'development',
            debug: false
        };

        // Try to load from localStorage (set by backend discovery)
        try {
            const storedPort = localStorage.getItem('audioToolsBackendPort');
            if (storedPort) {
                defaultConfig.backend.port = parseInt(storedPort);
            }
        } catch (error) {
            console.warn('Could not load stored port from localStorage:', error);
        }

        return defaultConfig;
    }

    /**
     * Get the complete backend URL
     */
    getBackendUrl() {
        const port = this.config.backend.port || this.config.backend.defaultPort;
        return `${this.config.backend.protocol}://${this.config.backend.host}:${port}`;
    }

    /**
     * Get the API base URL
     */
    getApiUrl() {
        return `${this.getBackendUrl()}${this.config.backend.apiPath}`;
    }

    /**
     * Get specific API endpoint URL
     */
    getApiEndpoint(service) {
        return `${this.getApiUrl()}/${service}`;
    }

    /**
     * Get health check URL
     */
    getHealthUrl() {
        return `${this.getApiUrl()}/health`;
    }

    /**
     * Get documentation URL
     */
    getDocsUrl() {
        return `${this.getBackendUrl()}/api/docs`;
    }

    /**
     * Update the backend port (called when port is discovered)
     */
    setBackendPort(port) {
        this.config.backend.port = port;
        try {
            localStorage.setItem('audioToolsBackendPort', port.toString());
        } catch (error) {
            console.warn('Could not save port to localStorage:', error);
        }
    }

    /**
     * Get current backend port
     */
    getBackendPort() {
        return this.config.backend.port || this.config.backend.defaultPort;
    }

    /**
     * Check if we're in development mode
     */
    isDevelopment() {
        return this.config.environment === 'development';
    }

    /**
     * Get configuration for specific service
     */
    getServiceConfig(service) {
        return {
            baseUrl: this.getApiEndpoint(service),
            healthUrl: this.getHealthUrl(),
            timeout: 30000,
            retries: 3
        };
    }
}

// Create global instance
window.EnvironmentConfig = EnvironmentConfig;
window.envConfig = new EnvironmentConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvironmentConfig;
}
