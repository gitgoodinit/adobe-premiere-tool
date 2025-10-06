/**
 * Rhythm Controller
 * Handles HTTP requests for rhythm analysis and timing corrections
 */

const { v4: uuidv4 } = require('uuid');
const RhythmService = require('../../services/rhythmService');
const Logger = require('../../utils/logger');

class RhythmController {
    constructor() {
        this.rhythmService = new RhythmService();
        this.logger = new Logger();
    }

    /**
     * Analyze rhythm and timing in audio file
     */
    async analyzeRhythm(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No audio file provided',
                    requestId
                });
            }

            const options = {
                segmentLength: parseFloat(req.body.segmentLength) || 2.0,
                overlapRatio: parseFloat(req.body.overlapRatio) || 0.5,
                enablePacingAnalysis: req.body.enablePacingAnalysis !== false,
                enableFlowAnalysis: req.body.enableFlowAnalysis !== false,
                language: req.body.language || 'en',
                sensitivityLevel: req.body.sensitivityLevel || 'medium'
            };

            // Perform rhythm analysis
            const results = await this.rhythmService.analyzeRhythm(req.file.path, options);

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                audioFile: {
                    originalName: req.file.originalname,
                    size: req.file.size,
                    uploadedAt: new Date().toISOString()
                },
                analysisOptions: options,
                results: {
                    speechRegions: results.speechRegions || [],
                    silenceRegions: results.silenceRegions || [],
                    pacingAnalysis: {
                        averageSpeechRate: results.pacingAnalysis?.averageSpeechRate || 0,
                        averagePauseDuration: results.pacingAnalysis?.averagePauseDuration || 0,
                        rhythmConsistency: results.pacingAnalysis?.rhythmConsistency || 0,
                        issues: results.pacingAnalysis?.issues || []
                    },
                    flowAnalysis: {
                        overallFlow: results.flowAnalysis?.overallFlow || 0,
                        speechPatterns: results.flowAnalysis?.speechPatterns || {},
                        silencePatterns: results.flowAnalysis?.silencePatterns || {},
                        transitions: results.flowAnalysis?.transitions || {}
                    },
                    totalDuration: results.totalDuration || 0,
                    confidence: results.confidence || 0,
                    recommendations: results.recommendations || []
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Rhythm analysis failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Apply timing corrections to audio file
     */
    async correctTiming(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No audio file provided',
                    requestId
                });
            }

            // Parse corrections if provided as string
            let corrections = req.body.corrections;
            if (typeof corrections === 'string') {
                try {
                    corrections = JSON.parse(corrections);
                } catch (parseError) {
                    return res.status(400).json({
                        error: 'Invalid corrections JSON format',
                        details: parseError.message,
                        requestId
                    });
                }
            }

            const options = {
                corrections: corrections || [],
                method: req.body.method || 'time_stretching',
                speedAdjustment: parseFloat(req.body.speedAdjustment) || 1.0,
                preservePitch: req.body.preservePitch !== false,
                outputFormat: req.body.outputFormat || 'mp3',
                quality: req.body.quality || 'high',
                targetSpeechRate: parseFloat(req.body.targetSpeechRate) || null,
                targetPauseDuration: parseFloat(req.body.targetPauseDuration) || null
            };

            // Perform timing correction
            const results = await this.rhythmService.correctTiming(req.file.path, options);

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                originalFile: {
                    name: req.file.originalname,
                    size: req.file.size,
                    duration: results.originalDuration
                },
                correctedFile: {
                    name: results.outputFileName,
                    duration: results.correctedDuration,
                    downloadUrl: `/temp/${results.outputFileName}`
                },
                correctionOptions: options,
                results: {
                    correctionsApplied: results.correctionsApplied || 0,
                    method: results.method || 'time_stretching',
                    speedAdjustment: options.speedAdjustment,
                    processingTime: results.processingTime
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Timing correction failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Get available timing correction algorithms
     */
    getAlgorithms(req, res) {
        try {
            const algorithms = this.rhythmService.getAvailableAlgorithms();
            
            res.json({
                success: true,
                algorithms: algorithms.map(algorithm => ({
                    id: algorithm.id,
                    name: algorithm.name,
                    description: algorithm.description,
                    accuracy: algorithm.accuracy,
                    quality: algorithm.quality,
                    requirements: algorithm.requirements
                }))
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get timing correction algorithms',
                message: error.message
            });
        }
    }

    /**
     * Get status of a rhythm analysis job
     */
    async getJobStatus(req, res) {
        try {
            const { requestId } = req.params;
            const status = this.rhythmService.getJobStatus(requestId);
            
            if (!status) {
                return res.status(404).json({
                    error: 'Job not found',
                    requestId
                });
            }

            res.json({
                success: true,
                requestId,
                status: status.status,
                progress: status.progress,
                results: status.results,
                error: status.error,
                createdAt: status.createdAt,
                updatedAt: status.updatedAt
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get job status',
                message: error.message
            });
        }
    }

    /**
     * Test rhythm analysis with sample audio
     */
    async testRhythmAnalysis(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            const options = {
                testMode: true,
                sampleDuration: parseFloat(req.body.sampleDuration) || 30.0,
                language: req.body.language || 'en'
            };

            // Generate mock results for testing
            const mockResults = {
                speechRegions: [
                    {
                        start: 0,
                        end: 10.5,
                        duration: 10.5,
                        speechRate: 3.2,
                        pauseDuration: 0.3,
                        intensity: 0.8,
                        pitch: 150
                    },
                    {
                        start: 11.0,
                        end: 20.2,
                        duration: 9.2,
                        speechRate: 2.8,
                        pauseDuration: 0.5,
                        intensity: 0.7,
                        pitch: 145
                    }
                ],
                silenceRegions: [
                    {
                        start: 10.5,
                        end: 11.0,
                        duration: 0.5,
                        confidence: 0.9
                    }
                ],
                pacingAnalysis: {
                    averageSpeechRate: 3.0,
                    averagePauseDuration: 0.4,
                    rhythmConsistency: 0.85,
                    issues: []
                },
                flowAnalysis: {
                    overallFlow: 0.82,
                    speechPatterns: {
                        totalSpeechTime: 19.7,
                        averageSegmentLength: 9.85,
                        speechRateVariation: 0.2,
                        intensityVariation: 0.1
                    },
                    silencePatterns: {
                        totalSilenceTime: 0.5,
                        averageSilenceLength: 0.5,
                        silenceLengthVariation: 0.0,
                        longPauses: 0
                    }
                },
                totalDuration: 20.2,
                confidence: 0.88,
                testMode: true
            };

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                testMode: true,
                analysisOptions: options,
                results: mockResults
            });

        } catch (error) {
            res.status(500).json({
                error: 'Test rhythm analysis failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }
}

module.exports = RhythmController;