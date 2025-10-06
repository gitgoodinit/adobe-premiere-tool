/**
 * Settings Controller
 * Handles HTTP requests for application settings management
 */

const { v4: uuidv4 } = require('uuid');
const SettingsService = require('../../services/settingsService');
const Logger = require('../../utils/logger');

class SettingsController {
    constructor() {
        this.settingsService = new SettingsService();
        this.logger = new Logger();
    }

    /**
     * Get current settings
     */
    async getSettings(req, res) {
        try {
            const settings = await this.settingsService.getSettings();
            
            res.json({
                success: true,
                settings,
                lastUpdated: settings.lastUpdated,
                version: settings.version
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get settings',
                message: error.message
            });
        }
    }

    /**
     * Update settings
     */
    async updateSettings(req, res) {
        const requestId = uuidv4();
        
        try {
            const updatedSettings = await this.settingsService.updateSettings(req.body);
            
            res.json({
                success: true,
                requestId,
                message: 'Settings updated successfully',
                settings: updatedSettings,
                lastUpdated: updatedSettings.lastUpdated
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to update settings',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Export settings configuration
     */
    async exportSettings(req, res) {
        const requestId = uuidv4();
        
        try {
            const options = {
                format: req.body.format || req.query.format || 'json',
                includeSecrets: req.body.includeSecrets === true || req.query.includeSecrets === 'true',
                includeDefaults: req.body.includeDefaults === true || req.query.includeDefaults === 'true'
            };

            const exportResult = await this.settingsService.exportSettings(options);
            
            // Set appropriate headers for file download
            res.setHeader('Content-Type', exportResult.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="settings.${exportResult.format}"`);
            res.setHeader('Content-Length', exportResult.size);
            
            // For JSON response, also include metadata
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                res.json({
                    success: true,
                    requestId,
                    export: exportResult,
                    downloadUrl: `/api/settings/export?format=${exportResult.format}`
                });
            } else {
                // Direct file download
                res.send(exportResult.data);
            }
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to export settings',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Import settings configuration
     */
    async importSettings(req, res) {
        const requestId = uuidv4();
        
        try {
            let data;
            let format = req.body.format || 'json';
            
            // Handle file upload or direct data
            if (req.file) {
                data = req.file.buffer.toString('utf8');
                // Try to detect format from file extension
                const ext = req.file.originalname.split('.').pop().toLowerCase();
                if (['json', 'yaml', 'yml', 'env'].includes(ext)) {
                    format = ext === 'yml' ? 'yaml' : ext;
                }
            } else if (req.body.data) {
                data = req.body.data;
            } else {
                return res.status(400).json({
                    error: 'No settings data provided',
                    requestId
                });
            }

            const options = {
                format,
                merge: req.body.merge !== false,
                validate: req.body.validate !== false,
                backup: req.body.backup !== false
            };

            const importResult = await this.settingsService.importSettings(data, options);
            
            res.json({
                success: true,
                requestId,
                message: 'Settings imported successfully',
                import: importResult,
                settings: importResult.settings
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to import settings',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Reset settings to defaults
     */
    async resetSettings(req, res) {
        const requestId = uuidv4();
        
        try {
            const options = {
                sections: req.body.sections || ['all'],
                backup: req.body.backup !== false
            };

            const resetResult = await this.settingsService.resetSettings(options);
            
            res.json({
                success: true,
                requestId,
                message: 'Settings reset successfully',
                reset: resetResult,
                settings: resetResult.settings
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to reset settings',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Validate current settings
     */
    async validateSettings(req, res) {
        try {
            const settings = await this.settingsService.getSettings();
            const validation = this.settingsService.validateSettings(settings);
            
            res.json({
                success: true,
                validation: {
                    isValid: validation.isValid,
                    errors: validation.errors,
                    warnings: validation.warnings,
                    score: validation.score
                }
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to validate settings',
                message: error.message
            });
        }
    }

    /**
     * Test API configurations
     */
    async testAPIConfiguration(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            const options = {
                apiType: req.body.apiType || req.query.apiType || 'all',
                timeout: parseInt(req.body.timeout) || 10000
            };

            // Mock API testing - in real implementation would test actual APIs
            const mockResults = {
                openai: { 
                    available: Math.random() > 0.3, 
                    error: Math.random() > 0.3 ? null : 'API key invalid or quota exceeded'
                },
                google: { 
                    available: Math.random() > 0.3, 
                    error: Math.random() > 0.3 ? null : 'Authentication failed'
                },
                overall: { available: false, error: null }
            };

            // Calculate overall status
            const totalTests = Object.keys(mockResults).filter(key => key !== 'overall').length;
            const passed = Object.values(mockResults).filter((result, index) => 
                index < totalTests && result.available
            ).length;

            mockResults.overall = {
                available: passed === totalTests,
                error: passed === totalTests ? null : `${totalTests - passed} API(s) failed`
            };

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                testOptions: options,
                results: {
                    ...mockResults,
                    totalTests,
                    passed,
                    failed: totalTests - passed,
                    successRate: totalTests > 0 ? (passed / totalTests) * 100 : 0
                }
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to test API configuration',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Get settings schema/documentation
     */
    getSettingsSchema(req, res) {
        try {
            const schema = {
                version: '1.0.0',
                sections: {
                    api: {
                        description: 'External API configurations',
                        properties: {
                            openai: {
                                apiKey: { type: 'string', required: false, sensitive: true },
                                model: { type: 'string', default: 'gpt-4o-mini' },
                                enabled: { type: 'boolean', default: false }
                            },
                            google: {
                                apiKey: { type: 'string', required: false, sensitive: true },
                                enabled: { type: 'boolean', default: false }
                            }
                        }
                    },
                    processing: {
                        description: 'Audio processing configurations',
                        properties: {
                            audioBufferSize: { type: 'number', min: 512, max: 16384, default: 4096 },
                            processingQuality: { type: 'string', enum: ['low', 'medium', 'high'], default: 'high' },
                            maxFileSize: { type: 'number', min: 1048576, max: 524288000, default: 104857600 }
                        }
                    },
                    audio: {
                        description: 'Audio format and quality settings',
                        properties: {
                            defaultFormat: { type: 'string', enum: ['mp3', 'wav', 'm4a', 'ogg'], default: 'mp3' },
                            sampleRate: { type: 'number', enum: [22050, 44100, 48000, 96000], default: 44100 },
                            channels: { type: 'number', min: 1, max: 8, default: 2 }
                        }
                    },
                    ui: {
                        description: 'User interface settings',
                        properties: {
                            theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' },
                            language: { type: 'string', default: 'en' },
                            logLevel: { type: 'string', enum: ['error', 'warn', 'info', 'debug'], default: 'info' }
                        }
                    },
                    advanced: {
                        description: 'Advanced system configurations',
                        properties: {
                            enableDebugMode: { type: 'boolean', default: false },
                            cacheTTL: { type: 'number', min: 60, max: 86400, default: 3600 },
                            rateLimitMax: { type: 'number', min: 10, max: 1000, default: 100 }
                        }
                    }
                }
            };
            
            res.json({
                success: true,
                schema
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get settings schema',
                message: error.message
            });
        }
    }
}

module.exports = SettingsController;