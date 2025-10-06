/**
 * Settings Service
 * Handles application settings and configuration management
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SettingsService {
    constructor() {
        this.settingsPath = path.join(__dirname, '../../config/settings.json');
        this.backupsPath = path.join(__dirname, '../../config/backups');
        this.settings = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Create config directory if it doesn't exist
            const configDir = path.dirname(this.settingsPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            // Create backups directory if it doesn't exist
            if (!fs.existsSync(this.backupsPath)) {
                fs.mkdirSync(this.backupsPath, { recursive: true });
            }

            // Load settings
            await this.loadSettings();
            
            this.isInitialized = true;
            
        } catch (error) {
            throw error;
        }
    }

    async loadSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                this.settings = JSON.parse(data);
            } else {
                this.settings = this.getDefaultSettings();
                await this.saveSettings();
            }
        } catch (error) {
            this.settings = this.getDefaultSettings();
        }
    }

    async saveSettings() {
        try {
            this.settings.lastUpdated = new Date().toISOString();
            this.settings.version = '1.0.0';
            
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
        } catch (error) {
            throw error;
        }
    }

    getDefaultSettings() {
        return {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            
            api: {
                openai: {
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: 'gpt-4o-mini',
                    baseURL: 'https://api.openai.com/v1',
                    maxTokens: 2000,
                    temperature: 0.3,
                    enabled: false
                },
                google: {
                    apiKey: process.env.GOOGLE_CLOUD_API_KEY || '',
                    endpoint: 'https://speech.googleapis.com/v1/speech:recognize',
                    model: 'latest_long',
                    enabled: false
                }
            },
            
            processing: {
                audioBufferSize: 4096,
                processingQuality: 'high',
                enableRealtimePreview: true,
                enableVisualFeedback: true,
                useCEPProcess: false,
                maxFileSize: 104857600, // 100MB
                maxFilesPerRequest: 10
            },
            
            audio: {
                defaultFormat: 'mp3',
                defaultQuality: 'high',
                sampleRate: 44100,
                channels: 2,
                bitRate: '192k',
                silenceThreshold: -30,
                minSilenceDuration: 0.5,
                overlapThreshold: 0.3,
                timingTolerance: 150
            },
            
            ui: {
                theme: 'dark',
                language: 'en',
                enableDebugConsole: process.env.NODE_ENV === 'development',
                logLevel: process.env.LOG_LEVEL || 'info',
                enableHotReload: process.env.NODE_ENV === 'development'
            },
            
            advanced: {
                enableDebugMode: process.env.NODE_ENV === 'development',
                enableMockAPIs: process.env.NODE_ENV === 'development',
                enableMockFFmpeg: process.env.NODE_ENV === 'development',
                cacheTTL: 3600,
                rateLimitWindow: 900000, // 15 minutes
                rateLimitMax: 100,
                enableMetrics: true,
                metricsPort: 9090
            }
        };
    }

    async getSettings() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return { ...this.settings };
    }

    async updateSettings(newSettings) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Merge new settings with existing settings
            this.settings = this.mergeSettings(this.settings, newSettings);
            
            // Validate settings
            const validation = this.validateSettings(this.settings);
            if (!validation.isValid) {
                throw new Error(`Settings validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Save settings
            await this.saveSettings();
            
            return { ...this.settings };
            
        } catch (error) {
            throw error;
        }
    }

    mergeSettings(existing, newSettings) {
        const merged = { ...existing };
        
        Object.keys(newSettings).forEach(key => {
            if (typeof newSettings[key] === 'object' && newSettings[key] !== null && !Array.isArray(newSettings[key])) {
                merged[key] = { ...merged[key], ...newSettings[key] };
            } else {
                merged[key] = newSettings[key];
            }
        });
        
        return merged;
    }

    validateSettings(settings) {
        const errors = [];
        const warnings = [];
        
        // Validate API settings
        if (settings.api?.openai?.apiKey && !settings.api.openai.apiKey.startsWith('sk-')) {
            errors.push('Invalid OpenAI API key format');
        }
        
        if (settings.api?.google?.apiKey && !settings.api.google.apiKey.startsWith('AIza')) {
            errors.push('Invalid Google Cloud API key format');
        }
        
        // Validate processing settings
        if (settings.processing?.audioBufferSize && (settings.processing.audioBufferSize < 512 || settings.processing.audioBufferSize > 16384)) {
            errors.push('Audio buffer size must be between 512 and 16384');
        }
        
        if (settings.processing?.maxFileSize && settings.processing.maxFileSize > 500 * 1024 * 1024) {
            warnings.push('Maximum file size is very large (500MB+)');
        }
        
        // Validate audio settings
        if (settings.audio?.sampleRate && ![22050, 44100, 48000, 96000].includes(settings.audio.sampleRate)) {
            errors.push('Invalid sample rate');
        }
        
        if (settings.audio?.channels && (settings.audio.channels < 1 || settings.audio.channels > 8)) {
            errors.push('Invalid number of channels');
        }
        
        // Calculate validation score
        const totalChecks = 10;
        const errorCount = errors.length;
        const warningCount = warnings.length;
        const score = Math.max(0, Math.round(((totalChecks - errorCount - warningCount * 0.5) / totalChecks) * 100));
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score
        };
    }

    async exportSettings(options = {}) {
        const {
            format = 'json',
            includeSecrets = false,
            includeDefaults = false
        } = options;

        try {
            let settings = { ...this.settings };
            
            // Remove secrets if not requested
            if (!includeSecrets) {
                if (settings.api?.openai?.apiKey) {
                    settings.api.openai.apiKey = 'sk-***';
                }
                if (settings.api?.google?.apiKey) {
                    settings.api.google.apiKey = 'AIza***';
                }
            }
            
            // Remove defaults if not requested
            if (!includeDefaults) {
                const defaults = this.getDefaultSettings();
                settings = this.removeDefaults(settings, defaults);
            }
            
            let data;
            let mimeType;
            
            switch (format) {
                case 'json':
                    data = JSON.stringify(settings, null, 2);
                    mimeType = 'application/json';
                    break;
                case 'yaml':
                    data = JSON.stringify(settings, null, 2);
                    mimeType = 'text/yaml';
                    break;
                case 'env':
                    data = this.convertToEnvFormat(settings);
                    mimeType = 'text/plain';
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
            return {
                data,
                format,
                mimeType,
                exportedAt: new Date().toISOString(),
                version: settings.version,
                size: Buffer.byteLength(data, 'utf8')
            };
            
        } catch (error) {
            throw error;
        }
    }

    async importSettings(data, options = {}) {
        const {
            format = 'json',
            merge = true,
            validate = true,
            backup = true
        } = options;

        try {
            let importedSettings;
            
            // Parse data based on format
            switch (format) {
                case 'json':
                    importedSettings = typeof data === 'string' ? JSON.parse(data) : data;
                    break;
                case 'yaml':
                    importedSettings = typeof data === 'string' ? JSON.parse(data) : data;
                    break;
                case 'env':
                    importedSettings = this.parseEnvFormat(data);
                    break;
                default:
                    throw new Error(`Unsupported import format: ${format}`);
            }
            
            // Validate imported settings
            if (validate) {
                const validation = this.validateSettings(importedSettings);
                if (!validation.isValid) {
                    throw new Error(`Imported settings validation failed: ${validation.errors.join(', ')}`);
                }
            }
            
            // Create backup if requested
            let backupCreated = false;
            if (backup) {
                await this.createBackup();
                backupCreated = true;
            }
            
            // Apply settings
            if (merge) {
                this.settings = this.mergeSettings(this.settings, importedSettings);
            } else {
                this.settings = { ...this.getDefaultSettings(), ...importedSettings };
            }
            
            await this.saveSettings();
            
            return {
                imported: true,
                skipped: false,
                errors: [],
                backupCreated,
                settings: { ...this.settings }
            };
            
        } catch (error) {
            throw error;
        }
    }

    async createBackup() {
        try {
            const backupId = uuidv4();
            const backupPath = path.join(this.backupsPath, `settings_${backupId}.json`);
            
            const backup = {
                id: backupId,
                name: `Settings Backup ${new Date().toISOString()}`,
                createdAt: new Date().toISOString(),
                version: this.settings.version,
                settings: { ...this.settings }
            };
            
            fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
            
            return backupId;
            
        } catch (error) {
            throw error;
        }
    }

    // Helper methods
    removeDefaults(settings, defaults) {
        const cleaned = {};
        
        Object.keys(settings).forEach(key => {
            if (typeof settings[key] === 'object' && settings[key] !== null && !Array.isArray(settings[key])) {
                if (defaults[key]) {
                    const cleanedNested = this.removeDefaults(settings[key], defaults[key]);
                    if (Object.keys(cleanedNested).length > 0) {
                        cleaned[key] = cleanedNested;
                    }
                } else {
                    cleaned[key] = settings[key];
                }
            } else if (settings[key] !== defaults[key]) {
                cleaned[key] = settings[key];
            }
        });
        
        return cleaned;
    }

    convertToEnvFormat(settings) {
        const lines = [];
        
        Object.keys(settings).forEach(section => {
            if (typeof settings[section] === 'object' && settings[section] !== null) {
                Object.keys(settings[section]).forEach(key => {
                    const value = settings[section][key];
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        lines.push(`${section.toUpperCase()}_${key.toUpperCase()}=${value}`);
                    }
                });
            }
        });
        
        return lines.join('\n');
    }

    parseEnvFormat(data) {
        const settings = {};
        const lines = data.split('\n');
        
        lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                const [section, setting] = key.toLowerCase().split('_');
                if (!settings[section]) {
                    settings[section] = {};
                }
                settings[section][setting] = value;
            }
        });
        
        return settings;
    }

    async cleanup() {
        try {
            // Clean up old backups (older than 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const files = fs.readdirSync(this.backupsPath);
            
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.backupsPath, file);
                    const stats = fs.statSync(filePath);
                    if (stats.mtime < thirtyDaysAgo) {
                        fs.unlinkSync(filePath);
                    }
                }
            });
            
            this.isInitialized = false;
            
        } catch (error) {
            // Silent cleanup
        }
    }
}

module.exports = SettingsService;