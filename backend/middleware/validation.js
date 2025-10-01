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
        enablePreprocessing: Joi.boolean().optional()
    }),

    silenceTrimming: Joi.object({
        silenceSegments: Joi.array().items(Joi.object({
            start: Joi.number().min(0).required(),
            end: Joi.number().min(0).required(),
            duration: Joi.number().min(0).required()
        })).optional(),
        trimMode: Joi.string().valid('remove', 'fade', 'compress').optional(),
        fadeInDuration: Joi.number().min(0).max(5).optional(),
        fadeOutDuration: Joi.number().min(0).max(5).optional(),
        compressionRatio: Joi.number().min(0.1).max(1).optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }),

    overlapDetection: Joi.object({
        sensitivity: Joi.number().min(1).max(10).optional(),
        frequencyRange: Joi.string().valid('full', 'speech', 'music').optional(),
        fftSize: Joi.number().valid(512, 1024, 2048, 4096).optional(),
        analysisMode: Joi.string().valid('realtime', 'batch', 'hybrid').optional(),
        overlapThreshold: Joi.number().min(0).max(1).optional(),
        minOverlapDuration: Joi.number().min(0.01).max(5).optional(),
        enableML: Joi.boolean().optional(),
        enableCrossCorrelation: Joi.boolean().optional(),
        enableHarmonicAnalysis: Joi.boolean().optional(),
        enableBackgroundNoiseDetection: Joi.boolean().optional()
    }),

    overlapResolution: Joi.object({
        resolutionMethod: Joi.string().valid('auto', 'shift', 'duck', 'trim').optional(),
        overlaps: Joi.array().items(Joi.object({
            start: Joi.number().min(0).required(),
            end: Joi.number().min(0).required(),
            tracks: Joi.array().items(Joi.number()).required()
        })).optional(),
        shiftAmount: Joi.number().min(0).max(10).optional(),
        duckingRatio: Joi.number().min(0).max(1).optional(),
        trimMode: Joi.string().valid('fade', 'cut', 'compress').optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional(),
        preserveOriginal: Joi.boolean().optional()
    }),

    multiTrackAnalysis: Joi.object({
        analysisTypes: Joi.array().items(Joi.string().valid('silence', 'overlap', 'sync')).optional(),
        trackTypes: Joi.array().items(Joi.string().valid('speech', 'music', 'effects', 'audio')).optional(),
        submixRouting: Joi.string().valid('auto', 'manual').optional(),
        silenceThreshold: Joi.number().min(-60).max(0).optional(),
        overlapThreshold: Joi.number().min(0).max(1).optional(),
        syncTolerance: Joi.number().min(0.01).max(1).optional(),
        enableRealTimeProcessing: Joi.boolean().optional(),
        enableSubmixRouting: Joi.boolean().optional()
    }),

    multiTrackSync: Joi.object({
        syncMethod: Joi.string().valid('auto', 'manual', 'cross-correlation').optional(),
        referenceTrack: Joi.number().min(0).max(5).optional(),
        syncTolerance: Joi.number().min(0.01).max(1).optional(),
        manualOffsets: Joi.array().items(Joi.number()).optional(),
        enableMultiCamSync: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }),

    dynamicDucking: Joi.object({
        primaryTrack: Joi.number().min(0).max(5).optional(),
        secondaryTracks: Joi.array().items(Joi.number().min(0).max(5)).optional(),
        duckingRatio: Joi.number().min(0).max(1).optional(),
        attackTime: Joi.number().min(0.001).max(1).optional(),
        releaseTime: Joi.number().min(0.001).max(1).optional(),
        threshold: Joi.number().min(-60).max(0).optional(),
        enableAutoDucking: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }),

    submixRouting: Joi.object({
        submixGroups: Joi.object({
            main: Joi.object({
                tracks: Joi.array().items(Joi.number()).optional(),
                gain: Joi.number().min(0).max(2).optional()
            }).optional(),
            speech: Joi.object({
                tracks: Joi.array().items(Joi.number()).optional(),
                gain: Joi.number().min(0).max(2).optional()
            }).optional(),
            music: Joi.object({
                tracks: Joi.array().items(Joi.number()).optional(),
                gain: Joi.number().min(0).max(2).optional()
            }).optional(),
            effects: Joi.object({
                tracks: Joi.array().items(Joi.number()).optional(),
                gain: Joi.number().min(0).max(2).optional()
            }).optional()
        }).optional(),
        trackAssignments: Joi.array().items(Joi.object({
            trackId: Joi.number().min(0).max(5).required(),
            submix: Joi.string().valid('main', 'speech', 'music', 'effects').required()
        })).optional(),
        enableAutoRouting: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    }),

    rhythmAnalysis: Joi.object({
        analysisTypes: Joi.array().items(Joi.string().valid('speech', 'silence', 'pacing', 'flow')).optional(),
        timingTolerance: Joi.number().min(50).max(500).optional(),
        enableGPTAnalysis: Joi.boolean().optional(),
        enableFlowAnalysis: Joi.boolean().optional(),
        enablePreciseTiming: Joi.boolean().optional(),
        language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt', 'auto').optional(),
        confidenceThreshold: Joi.number().min(0).max(1).optional()
    }),

    timingCorrection: Joi.object({
        corrections: Joi.array().items(Joi.object({
            type: Joi.string().valid('long_pause', 'short_segment', 'pacing', 'flow').required(),
            timestamp: Joi.number().min(0).required(),
            originalDuration: Joi.number().min(0).required(),
            suggestedDuration: Joi.number().min(0).required(),
            confidence: Joi.number().min(0).max(1).required(),
            apply: Joi.boolean().optional()
        })).optional(),
        stretchAlgorithm: Joi.string().valid('phase_vocoder', 'granular', 'wsola').optional(),
        timingTolerance: Joi.number().min(50).max(500).optional(),
        enablePreciseTiming: Joi.boolean().optional(),
        enableValidation: Joi.boolean().optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional(),
        preserveOriginal: Joi.boolean().optional()
    }),

    correctionGeneration: Joi.object({
        analysisResults: Joi.object().optional(),
        correctionTypes: Joi.array().items(Joi.string().valid('long_pause', 'short_segment', 'pacing', 'flow')).optional(),
        timingTolerance: Joi.number().min(50).max(500).optional(),
        enableGPTAnalysis: Joi.boolean().optional(),
        confidenceThreshold: Joi.number().min(0).max(1).optional(),
        maxCorrections: Joi.number().min(1).max(100).optional()
    }),

    timingPreview: Joi.object({
        corrections: Joi.array().items(Joi.object({
            type: Joi.string().valid('long_pause', 'short_segment', 'pacing', 'flow').required(),
            timestamp: Joi.number().min(0).required(),
            originalDuration: Joi.number().min(0).required(),
            suggestedDuration: Joi.number().min(0).required(),
            confidence: Joi.number().min(0).max(1).required()
        })).optional(),
        stretchAlgorithm: Joi.string().valid('phase_vocoder', 'granular', 'wsola').optional(),
        previewDuration: Joi.number().min(5).max(300).optional(),
        previewStartTime: Joi.number().min(0).optional(),
        outputFormat: Joi.string().valid('mp3', 'wav', 'm4a', 'ogg').optional(),
        quality: Joi.string().valid('low', 'medium', 'high').optional()
    })
};

// Validation functions
function validateSilenceDetection(data) {
    return schemas.silenceDetection.validate(data);
}

function validateSilenceTrimming(data) {
    return schemas.silenceTrimming.validate(data);
}

function validateOverlapDetection(data) {
    return schemas.overlapDetection.validate(data);
}

function validateOverlapResolution(data) {
    return schemas.overlapResolution.validate(data);
}

function validateMultiTrackAnalysis(data) {
    return schemas.multiTrackAnalysis.validate(data);
}

function validateMultiTrackSync(data) {
    return schemas.multiTrackSync.validate(data);
}

function validateDynamicDucking(data) {
    return schemas.dynamicDucking.validate(data);
}

function validateSubmixRouting(data) {
    return schemas.submixRouting.validate(data);
}

function validateRhythmAnalysis(data) {
    return schemas.rhythmAnalysis.validate(data);
}

function validateTimingCorrection(data) {
    return schemas.timingCorrection.validate(data);
}

function validateCorrectionGeneration(data) {
    return schemas.correctionGeneration.validate(data);
}

function validateTimingPreview(data) {
    return schemas.timingPreview.validate(data);
}

module.exports = {
    validateSilenceDetection,
    validateSilenceTrimming,
    validateOverlapDetection,
    validateOverlapResolution,
    validateMultiTrackAnalysis,
    validateMultiTrackSync,
    validateDynamicDucking,
    validateSubmixRouting,
    validateRhythmAnalysis,
    validateTimingCorrection,
    validateCorrectionGeneration,
    validateTimingPreview
};
