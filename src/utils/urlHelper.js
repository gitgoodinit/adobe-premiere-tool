/**
 * URL Helper Utilities
 * Provides helper functions for URL management and API calls
 */

class UrlHelper {
    constructor() {
        this.envConfig = window.envConfig;
    }

    /**
     * Get API URL for a specific service
     */
    getApiUrl(service, endpoint = '') {
        if (this.envConfig) {
            const baseUrl = this.envConfig.getApiEndpoint(service);
            return endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
        }
        
        // Fallback
        const port = localStorage.getItem('audioToolsBackendPort') || '3000';
        const baseUrl = `http://localhost:${port}/api/${service}`;
        return endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
    }

    /**
     * Make an API call with proper error handling
     */
    async makeApiCall(service, endpoint, options = {}) {
        const url = this.getApiUrl(service, endpoint);
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API call to ${url} failed:`, error);
            throw error;
        }
    }

    /**
     * Test backend connectivity
     */
    async testBackendConnection() {
        try {
            const healthUrl = this.envConfig ? this.envConfig.getHealthUrl() : 'http://localhost:3000/api/health';
            const response = await fetch(healthUrl, { timeout: 5000 });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    connected: true,
                    port: this.envConfig ? this.envConfig.getBackendPort() : 3000,
                    data: data
                };
            }
            
            return { connected: false, error: 'Health check failed' };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    /**
     * Get current backend configuration
     */
    getBackendConfig() {
        if (this.envConfig) {
            return {
                url: this.envConfig.getBackendUrl(),
                apiUrl: this.envConfig.getApiUrl(),
                port: this.envConfig.getBackendPort(),
                healthUrl: this.envConfig.getHealthUrl(),
                docsUrl: this.envConfig.getDocsUrl()
            };
        }

        const port = localStorage.getItem('audioToolsBackendPort') || '3000';
        return {
            url: `http://localhost:${port}`,
            apiUrl: `http://localhost:${port}/api`,
            port: parseInt(port),
            healthUrl: `http://localhost:${port}/api/health`,
            docsUrl: `http://localhost:${port}/api/docs`
        };
    }
}

// Create global instance
window.UrlHelper = UrlHelper;
window.urlHelper = new UrlHelper();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UrlHelper;
}
