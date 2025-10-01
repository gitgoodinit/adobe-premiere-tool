/**
 * Settings & Configuration API Routes
 * Handles all settings management and configuration operations
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SettingsManager = require('../services/SettingsManager');
const Logger = require('../services/Logger');

const router = express.Router();
const logger = new Logger();

// Initialize services
const settingsManager = new SettingsManager();

/**
 * @route GET /api/settings
 * @desc Get current settings configuration
 * @access Public
 */
router.get('/', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Getting current settings`);

        const settings = await settingsManager.getSettings();

        res.json({
            success: true,
            requestId,
            settings: {
                api: settings.api || {},
                processing: settings.processing || {},
                audio: settings.audio || {},
                ui: settings.ui || {},
                advanced: settings.advanced || {}
            },
            metadata: {
                lastUpdated: settings.lastUpdated || null,
                version: settings.version || '1.0.0',
                environment: settings.environment || 'development'
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to get settings:`, error);
        
        res.status(500).json({
            error: 'Failed to get settings',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route PUT /api/settings
 * @desc Update settings configuration
 * @access Public
 */
router.put('/', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Updating settings`);

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                error: 'Invalid settings data',
                requestId
            });
        }

        const updatedSettings = await settingsManager.updateSettings(req.body);

        res.json({
            success: true,
            requestId,
            message: 'Settings updated successfully',
            settings: {
                api: updatedSettings.api || {},
                processing: updatedSettings.processing || {},
                audio: updatedSettings.audio || {},
                ui: updatedSettings.ui || {},
                advanced: updatedSettings.advanced || {}
            },
            metadata: {
                lastUpdated: updatedSettings.lastUpdated,
                version: updatedSettings.version,
                environment: updatedSettings.environment
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to update settings:`, error);
        
        res.status(500).json({
            error: 'Failed to update settings',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route POST /api/settings/export
 * @desc Export current settings configuration
 * @access Public
 */
router.post('/export', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Exporting settings`);

        const exportOptions = {
            format: req.body.format || 'json', // 'json', 'yaml', 'env'
            includeSecrets: req.body.includeSecrets || false,
            includeDefaults: req.body.includeDefaults || false
        };

        const exportedData = await settingsManager.exportSettings(exportOptions);

        res.json({
            success: true,
            requestId,
            exportOptions,
            data: exportedData.data,
            metadata: {
                format: exportedData.format,
                exportedAt: exportedData.exportedAt,
                version: exportedData.version,
                size: exportedData.size
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to export settings:`, error);
        
        res.status(500).json({
            error: 'Failed to export settings',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route POST /api/settings/import
 * @desc Import settings configuration
 * @access Public
 */
router.post('/import', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Importing settings`);

        if (!req.body.data) {
            return res.status(400).json({
                error: 'No settings data provided',
                requestId
            });
        }

        const importOptions = {
            format: req.body.format || 'json',
            merge: req.body.merge !== false, // true = merge, false = replace
            validate: req.body.validate !== false,
            backup: req.body.backup !== false
        };

        const importResult = await settingsManager.importSettings(req.body.data, importOptions);

        res.json({
            success: true,
            requestId,
            message: 'Settings imported successfully',
            importOptions,
            result: {
                imported: importResult.imported,
                skipped: importResult.skipped,
                errors: importResult.errors,
                backupCreated: importResult.backupCreated
            },
            settings: {
                api: importResult.settings.api || {},
                processing: importResult.settings.processing || {},
                audio: importResult.settings.audio || {},
                ui: importResult.settings.ui || {},
                advanced: importResult.settings.advanced || {}
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to import settings:`, error);
        
        res.status(500).json({
            error: 'Failed to import settings',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route POST /api/settings/reset
 * @desc Reset settings to default values
 * @access Public
 */
router.post('/reset', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Resetting settings to defaults`);

        const resetOptions = {
            sections: req.body.sections || ['all'], // ['all', 'api', 'processing', 'audio', 'ui', 'advanced']
            backup: req.body.backup !== false
        };

        const resetResult = await settingsManager.resetSettings(resetOptions);

        res.json({
            success: true,
            requestId,
            message: 'Settings reset successfully',
            resetOptions,
            result: {
                sectionsReset: resetResult.sectionsReset,
                backupCreated: resetResult.backupCreated,
                defaultSettings: resetResult.defaultSettings
            },
            settings: {
                api: resetResult.settings.api || {},
                processing: resetResult.settings.processing || {},
                audio: resetResult.settings.audio || {},
                ui: resetResult.settings.ui || {},
                advanced: resetResult.settings.advanced || {}
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to reset settings:`, error);
        
        res.status(500).json({
            error: 'Failed to reset settings',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route GET /api/settings/validate
 * @desc Validate current settings configuration
 * @access Public
 */
router.get('/validate', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Validating settings`);

        const validationResult = await settingsManager.validateSettings();

        res.json({
            success: true,
            requestId,
            validation: {
                isValid: validationResult.isValid,
                errors: validationResult.errors || [],
                warnings: validationResult.warnings || [],
                score: validationResult.score || 0
            },
            settings: validationResult.settings || {}
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to validate settings:`, error);
        
        res.status(500).json({
            error: 'Failed to validate settings',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route GET /api/settings/schema
 * @desc Get settings schema and validation rules
 * @access Public
 */
router.get('/schema', (req, res) => {
    try {
        const schema = settingsManager.getSettingsSchema();
        
        res.json({
            success: true,
            schema: {
                api: schema.api || {},
                processing: schema.processing || {},
                audio: schema.audio || {},
                ui: schema.ui || {},
                advanced: schema.advanced || {}
            },
            metadata: {
                version: schema.version || '1.0.0',
                lastUpdated: schema.lastUpdated || null
            }
        });
    } catch (error) {
        logger.error('Failed to get settings schema:', error);
        res.status(500).json({
            error: 'Failed to get settings schema',
            message: error.message
        });
    }
});

/**
 * @route POST /api/settings/test-api
 * @desc Test API configuration
 * @access Public
 */
router.post('/test-api', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Testing API configuration`);

        const testOptions = {
            apiType: req.body.apiType || 'all', // 'all', 'openai', 'google'
            timeout: parseInt(req.body.timeout) || 10000
        };

        const testResults = await settingsManager.testAPIConfiguration(testOptions);

        res.json({
            success: true,
            requestId,
            testOptions,
            results: {
                openai: testResults.openai || {},
                google: testResults.google || {},
                overall: testResults.overall || {}
            },
            summary: {
                totalTests: testResults.totalTests || 0,
                passed: testResults.passed || 0,
                failed: testResults.failed || 0,
                successRate: testResults.successRate || 0
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to test API configuration:`, error);
        
        res.status(500).json({
            error: 'Failed to test API configuration',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route GET /api/settings/backups
 * @desc Get list of settings backups
 * @access Public
 */
router.get('/backups', async (req, res) => {
    const requestId = uuidv4();
    
    try {
        logger.info(`[${requestId}] Getting settings backups`);

        const backups = await settingsManager.getBackups();

        res.json({
            success: true,
            requestId,
            backups: backups.map(backup => ({
                id: backup.id,
                name: backup.name,
                createdAt: backup.createdAt,
                size: backup.size,
                description: backup.description,
                version: backup.version
            })),
            metadata: {
                totalBackups: backups.length,
                totalSize: backups.reduce((sum, backup) => sum + backup.size, 0)
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to get backups:`, error);
        
        res.status(500).json({
            error: 'Failed to get backups',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route POST /api/settings/restore/:backupId
 * @desc Restore settings from backup
 * @access Public
 */
router.post('/restore/:backupId', async (req, res) => {
    const requestId = uuidv4();
    const { backupId } = req.params;
    
    try {
        logger.info(`[${requestId}] Restoring settings from backup: ${backupId}`);

        const restoreResult = await settingsManager.restoreBackup(backupId);

        res.json({
            success: true,
            requestId,
            message: 'Settings restored successfully',
            backupId,
            result: {
                restored: restoreResult.restored,
                backupInfo: restoreResult.backupInfo
            },
            settings: {
                api: restoreResult.settings.api || {},
                processing: restoreResult.settings.processing || {},
                audio: restoreResult.settings.audio || {},
                ui: restoreResult.settings.ui || {},
                advanced: restoreResult.settings.advanced || {}
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Failed to restore backup:`, error);
        
        res.status(500).json({
            error: 'Failed to restore backup',
            message: error.message,
            requestId
        });
    }
});

module.exports = router;
