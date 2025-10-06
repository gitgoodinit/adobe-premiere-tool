/**
 * Request Validation Middleware
 * Validates request data using Joi schemas
 */

const Joi = require('joi');

// Validation schemas
const schemas = {
    silenceDetection: Joi.object({
        methods: Joi.array().items(Joi.string().valid('ffmpeg', 'webAudio', 'transcript')).optional(),
        noiseThreshold: Joi.number().min(-60).max(0).optional(),
        minDuration: Joi.number().min(0.1).max(10).optional(),
        confidenceThreshold: Joi.number().min(0).max(1).optional(),
        enableAI: Joi.boolean().optional(),
        enablePreprocessing: Joi.boolean().optional(),
        language: Joi.string().optional(),
        pauseThreshold: Joi.number().min(-50).max(-15).optional(),
        pauseMinDuration: Joi.number().min(0.1).max(5).optional(),
        silenceThreshold: Joi.number().min(-60).max(0).optional(),
        enableEnhanced: Joi.boolean().optional(),
        trimMode: Joi.string().optional(),
        outputFormat: Joi.string().optional()
    }).unknown(true),

    silenceTrimming: Joi.object({
        silenceSegments: Joi.array().items(Joi.object({
            start: Joi.number().min(0).required(),
            end: Joi.number().min(0).required(),
            duration: Joi.number().min(0).required(),
            method: Joi.string().optional(),
            confidence: Joi.number().min(0).max(1).optional()
        })).optional(),
        trimMode: Joi.string().valid('remove', 'fade', 'compress').optional(),
        fadeInDuration: Joi.number().min(0).max(5).optional(),
        fadeOutDuration: Joi.number().min(0).max(5).optional(),
        compressionRatio: Joi.number().min(0.1).max(1).optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }).unknown(true),

    overlapDetection: Joi.object({
        algorithm: Joi.string().valid('frequency_domain', 'cross_correlation', 'ai_analysis').optional(),
        threshold: Joi.number().min(0).max(1).optional(),
        confidenceThreshold: Joi.number().min(0).max(1).optional(),
        windowSize: Joi.number().valid(512, 1024, 2048, 4096).optional(),
        hopSize: Joi.number().valid(256, 512, 1024, 2048).optional(),
        maxLag: Joi.number().min(0).max(10).optional(),
        sensitivity: Joi.number().min(1).max(10).optional(),
        frequencyRange: Joi.string().optional(),
        fftSize: Joi.number().optional(),
        analysisMode: Joi.string().optional(),
        overlapThreshold: Joi.number().min(0).max(1).optional(),
        minOverlapDuration: Joi.number().min(0).max(10).optional(),
        enableML: Joi.boolean().optional(),
        enableCrossCorrelation: Joi.boolean().optional(),
        enableHarmonicAnalysis: Joi.boolean().optional(),
        enableBackgroundNoiseDetection: Joi.boolean().optional()
    }).unknown(true),

    overlapResolution: Joi.object({
        overlaps: Joi.array().items(Joi.object({
            start: Joi.number().min(0).required(),
            end: Joi.number().min(0).required(),
            tracks: Joi.array().items(Joi.number()).required()
        })).optional(),
        resolutionMethod: Joi.string().valid('trim', 'fade', 'duck', 'shift').optional(),
        fadeInDuration: Joi.number().min(0).max(5).optional(),
        fadeOutDuration: Joi.number().min(0).max(5).optional(),
        duckingLevel: Joi.number().min(0).max(1).optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }).unknown(true),

    rhythmAnalysis: Joi.object({
        segmentLength: Joi.number().min(0.5).max(10).optional(),
        overlapRatio: Joi.number().min(0).max(1).optional(),
        enablePacingAnalysis: Joi.boolean().optional(),
        enableFlowAnalysis: Joi.boolean().optional(),
        language: Joi.string().optional(),
        sensitivityLevel: Joi.string().valid('low', 'medium', 'high').optional(),
        timingTolerance: Joi.number().min(0).max(1).optional(),
        stretchAlgorithm: Joi.string().optional()
    }).unknown(true),

    timingCorrection: Joi.object({
        corrections: Joi.array().items(Joi.object({
            type: Joi.string().required(),
            timestamp: Joi.number().min(0).required(),
            originalDuration: Joi.number().min(0).required(),
            suggestedDuration: Joi.number().min(0).required(),
            confidence: Joi.number().min(0).max(1).required()
        })).optional(),
        method: Joi.string().valid('time_stretching', 'silence_adjustment', 'dynamic_pacing').optional(),
        speedAdjustment: Joi.number().min(0.5).max(2.0).optional(),
        preservePitch: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional(),
        targetSpeechRate: Joi.number().min(1).max(10).optional(),
        targetPauseDuration: Joi.number().min(0.1).max(5).optional()
    }).unknown(true),

    settingsUpdate: Joi.object({
        api: Joi.object().optional(),
        processing: Joi.object().optional(),
        audio: Joi.object().optional(),
        ui: Joi.object().optional(),
        advanced: Joi.object().optional()
    }).unknown(true),

    settingsExport: Joi.object({
        format: Joi.string().valid('json', 'yaml', 'env').optional(),
        includeSecrets: Joi.boolean().optional(),
        includeDefaults: Joi.boolean().optional()
    }).unknown(true),

    settingsImport: Joi.object({
        format: Joi.string().valid('json', 'yaml', 'env').optional(),
        merge: Joi.boolean().optional(),
        validate: Joi.boolean().optional(),
        backup: Joi.boolean().optional(),
        data: Joi.string().optional()
    }).unknown(true),

    settingsReset: Joi.object({
        sections: Joi.array().items(Joi.string()).optional(),
        backup: Joi.boolean().optional()
    }).unknown(true),

    multiTrackAnalysis: Joi.object({
        analysisTypes: Joi.array().items(Joi.string().valid('silence', 'overlap', 'sync')).optional(),
        trackTypes: Joi.array().items(Joi.string()).optional(),
        submixRouting: Joi.string().optional(),
        silenceThreshold: Joi.number().min(-60).max(0).optional(),
        overlapThreshold: Joi.number().min(0).max(1).optional(),
        syncTolerance: Joi.number().min(0).max(1).optional(),
        enableRealTimeProcessing: Joi.boolean().optional(),
        enableSubmixRouting: Joi.boolean().optional()
    }).unknown(true),

    multiTrackSync: Joi.object({
        syncMethod: Joi.string().valid('auto', 'manual', 'cross-correlation').optional(),
        referenceTrack: Joi.number().min(0).optional(),
        syncTolerance: Joi.number().min(0).max(1).optional(),
        manualOffsets: Joi.array().items(Joi.number()).optional(),
        enableMultiCamSync: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }).unknown(true),

    dynamicDucking: Joi.object({
        primaryTrack: Joi.number().min(0).optional(),
        secondaryTracks: Joi.array().items(Joi.number()).optional(),
        duckingRatio: Joi.number().min(0).max(1).optional(),
        attackTime: Joi.number().min(0).max(1).optional(),
        releaseTime: Joi.number().min(0).max(1).optional(),
        threshold: Joi.number().min(-60).max(0).optional(),
        enableAutoDucking: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }).unknown(true),

    submixRouting: Joi.object({
        submixGroups: Joi.object().optional(),
        trackAssignments: Joi.array().optional(),
        enableAutoRouting: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }).unknown(true)
};

// Middleware functions
function validateSilenceDetection(req, res, next) {
    // Parse methods array if it's a string (common with FormData)
    if (req.body.methods && typeof req.body.methods === 'string') {
        try {
            req.body.methods = JSON.parse(req.body.methods);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.silenceDetection.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateSilenceTrimming(req, res, next) {
    // Parse silenceSegments array if it's a string (common with FormData)
    if (req.body.silenceSegments && typeof req.body.silenceSegments === 'string') {
        try {
            req.body.silenceSegments = JSON.parse(req.body.silenceSegments);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.silenceTrimming.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateOverlapDetection(req, res, next) {
    const { error } = schemas.overlapDetection.validate(req.body);
    if (error) {
        // Add debug log for backend
        console.error('Overlap validation error:', error.details);
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message,
            debug: req.body // include request body for debugging
        });
    }
    next();
}

function validateOverlapResolution(req, res, next) {
    // Parse overlaps array if it's a string (common with FormData)
    if (req.body.overlaps && typeof req.body.overlaps === 'string') {
        try {
            req.body.overlaps = JSON.parse(req.body.overlaps);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.overlapResolution.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateRhythmAnalysis(req, res, next) {
    const { error } = schemas.rhythmAnalysis.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateTimingCorrection(req, res, next) {
    // Parse corrections array if it's a string (common with FormData)
    if (req.body.corrections && typeof req.body.corrections === 'string') {
        try {
            req.body.corrections = JSON.parse(req.body.corrections);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.timingCorrection.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateSettingsUpdate(req, res, next) {
    const { error } = schemas.settingsUpdate.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateSettingsExport(req, res, next) {
    const { error } = schemas.settingsExport.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateSettingsImport(req, res, next) {
    const { error } = schemas.settingsImport.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateSettingsReset(req, res, next) {
    // Parse sections array if it's a string (common with FormData)
    if (req.body.sections && typeof req.body.sections === 'string') {
        try {
            req.body.sections = JSON.parse(req.body.sections);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.settingsReset.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateMultiTrackAnalysis(req, res, next) {
    // Parse array fields if they're strings (common with FormData)
    ['analysisTypes', 'trackTypes'].forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
            try {
                req.body[field] = JSON.parse(req.body[field]);
            } catch (e) {
                // If parsing fails, leave as string and let validation catch it
            }
        }
    });

    const { error } = schemas.multiTrackAnalysis.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateMultiTrackSync(req, res, next) {
    // Parse array fields if they're strings (common with FormData)
    if (req.body.manualOffsets && typeof req.body.manualOffsets === 'string') {
        try {
            req.body.manualOffsets = JSON.parse(req.body.manualOffsets);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.multiTrackSync.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateDynamicDucking(req, res, next) {
    // Parse array fields if they're strings (common with FormData)
    if (req.body.secondaryTracks && typeof req.body.secondaryTracks === 'string') {
        try {
            req.body.secondaryTracks = JSON.parse(req.body.secondaryTracks);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.dynamicDucking.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

function validateSubmixRouting(req, res, next) {
    // Parse array fields if they're strings (common with FormData)
    if (req.body.trackAssignments && typeof req.body.trackAssignments === 'string') {
        try {
            req.body.trackAssignments = JSON.parse(req.body.trackAssignments);
        } catch (e) {
            // If parsing fails, leave as string and let validation catch it
        }
    }

    const { error } = schemas.submixRouting.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details,
            message: error.message
        });
    }
    next();
}

module.exports = {
    validateSilenceDetection,
    validateSilenceTrimming,
    validateOverlapDetection,
    validateOverlapResolution,
    validateRhythmAnalysis,
    validateTimingCorrection,
    validateSettingsUpdate,
    validateSettingsExport,
    validateSettingsImport,
    validateSettingsReset,
    validateMultiTrackAnalysis,
    validateMultiTrackSync,
    validateDynamicDucking,
    validateSubmixRouting
};