/**
 * Multi-Track Audio Controller
 * Handles HTTP requests for multi-track audio operations
 */

const { v4: uuidv4 } = require('uuid');
const Logger = require('../../utils/logger');
const MultiTrackService = require('../../services/multitrackService');
const FileUtils = require('../../utils/fileUtils');

class MultitrackController {
    constructor() {
        this.logger = new Logger();
        this.multiTrackService = new MultiTrackService();
        this.fileUtils = new FileUtils();
    }

    /**
     * Analyze multiple audio tracks for silence, overlaps, and sync
     */
    async analyzeTracks(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            this.logger.info(`[${requestId}] Starting multi-track analysis`, {
                fileCount: req.files?.length || 0
            });

            if (!req.files || req.files.length < 2) {
                return res.status(400).json({
                    error: 'At least 2 audio files required for multi-track analysis',
                    requestId
                });
            }

            if (req.files.length > 6) {
                return res.status(400).json({
                    error: 'Maximum 6 audio tracks supported',
                    requestId
                });
            }

            const options = {
                analysisTypes: req.body.analysisTypes || ['silence', 'overlap', 'sync'],
                trackTypes: req.body.trackTypes || [],
                submixRouting: req.body.submixRouting || 'auto',
                silenceThreshold: parseFloat(req.body.silenceThreshold) || -30,
                overlapThreshold: parseFloat(req.body.overlapThreshold) || 0.3,
                syncTolerance: parseFloat(req.body.syncTolerance) || 0.1,
                enableRealTimeProcessing: req.body.enableRealTimeProcessing !== false,
                enableSubmixRouting: req.body.enableSubmixRouting !== false
            };

            const results = await this.multiTrackService.analyzeTracks(req.files, options);
            const processingTime = Date.now() - startTime;
            
            this.logger.info(`[${requestId}] Multi-track analysis completed`, {
                processingTime: `${processingTime}ms`,
                tracksAnalyzed: results.tracksAnalyzed || 0
            });

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                audioTracks: req.files.map((file, index) => ({
                    trackId: index,
                    originalName: file.originalname,
                    size: file.size,
                    trackType: options.trackTypes[index] || 'audio',
                    uploadedAt: new Date().toISOString()
                })),
                analysisOptions: options,
                results: {
                    tracksAnalyzed: results.tracksAnalyzed || 0,
                    silenceAnalysis: results.silenceAnalysis || {},
                    overlapAnalysis: results.overlapAnalysis || {},
                    syncAnalysis: results.syncAnalysis || {},
                    submixRouting: results.submixRouting || {},
                    recommendations: results.recommendations || []
                },
                statistics: {
                    totalSilenceDuration: results.totalSilenceDuration || 0,
                    totalOverlaps: results.totalOverlaps || 0,
                    syncIssues: results.syncIssues || 0,
                    processingQuality: results.processingQuality || 'high'
                }
            });

        } catch (error) {
            this.logger.error(`[${requestId}] Multi-track analysis failed:`, error);
            
            res.status(500).json({
                error: 'Multi-track analysis failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        } finally {
            // Clean up uploaded files
            if (req.files) {
                await this.fileUtils.cleanupUploadedFiles(req.files);
            }
        }
    }

    /**
     * Sync multiple audio tracks
     */
    async syncTracks(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            this.logger.info(`[${requestId}] Starting multi-track sync`, {
                fileCount: req.files?.length || 0
            });

            if (!req.files || req.files.length < 2) {
                return res.status(400).json({
                    error: 'At least 2 audio files required for sync',
                    requestId
                });
            }

            const options = {
                syncMethod: req.body.syncMethod || 'auto',
                referenceTrack: parseInt(req.body.referenceTrack) || 0,
                syncTolerance: parseFloat(req.body.syncTolerance) || 0.1,
                manualOffsets: req.body.manualOffsets || [],
                enableMultiCamSync: req.body.enableMultiCamSync || false,
                outputFormat: req.body.outputFormat || 'mp3',
                quality: req.body.quality || 'high'
            };

            const result = await this.multiTrackService.syncTracks(req.files, options);
            const processingTime = Date.now() - startTime;
            
            this.logger.info(`[${requestId}] Multi-track sync completed`, {
                processingTime: `${processingTime}ms`,
                tracksSynced: result.tracksSynced || 0
            });

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                originalTracks: req.files.map(file => ({
                    name: file.originalname,
                    size: file.size
                })),
                syncedTracks: result.syncedTracks?.map(track => ({
                    name: track.name,
                    size: track.size,
                    offset: track.offset,
                    downloadUrl: `/temp/${track.name}`
                })) || [],
                syncOptions: options,
                results: {
                    tracksSynced: result.tracksSynced || 0,
                    syncMethod: result.syncMethod || 'auto',
                    averageOffset: result.averageOffset || 0,
                    maxOffset: result.maxOffset || 0,
                    syncQuality: result.syncQuality || 'high'
                },
                syncData: {
                    offsets: result.offsets || [],
                    correlationScores: result.correlationScores || [],
                    timeAlignment: result.timeAlignment || {},
                    syncConfidence: result.syncConfidence || 0
                }
            });

        } catch (error) {
            this.logger.error(`[${requestId}] Multi-track sync failed:`, error);
            
            res.status(500).json({
                error: 'Multi-track sync failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        } finally {
            if (req.files) {
                await this.fileUtils.cleanupUploadedFiles(req.files);
            }
        }
    }

    /**
     * Configure dynamic ducking for multiple tracks
     */
    async configureDucking(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            this.logger.info(`[${requestId}] Starting dynamic ducking configuration`, {
                fileCount: req.files?.length || 0
            });

            if (!req.files || req.files.length < 2) {
                return res.status(400).json({
                    error: 'At least 2 audio files required for ducking',
                    requestId
                });
            }

            const options = {
                primaryTrack: parseInt(req.body.primaryTrack) || 0,
                secondaryTracks: req.body.secondaryTracks || [],
                duckingRatio: parseFloat(req.body.duckingRatio) || 0.3,
                attackTime: parseFloat(req.body.attackTime) || 0.01,
                releaseTime: parseFloat(req.body.releaseTime) || 0.1,
                threshold: parseFloat(req.body.threshold) || -20,
                enableAutoDucking: req.body.enableAutoDucking !== false,
                outputFormat: req.body.outputFormat || 'mp3',
                quality: req.body.quality || 'high'
            };

            const result = await this.multiTrackService.configureDucking(req.files, options);
            const processingTime = Date.now() - startTime;
            
            this.logger.info(`[${requestId}] Dynamic ducking configuration completed`, {
                processingTime: `${processingTime}ms`,
                tracksProcessed: result.tracksProcessed || 0
            });

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                originalTracks: req.files.map(file => ({
                    name: file.originalname,
                    size: file.size
                })),
                duckedTracks: result.duckedTracks?.map(track => ({
                    name: track.name,
                    size: track.size,
                    duckingApplied: track.duckingApplied,
                    downloadUrl: `/temp/${track.name}`
                })) || [],
                duckingOptions: options,
                results: {
                    tracksProcessed: result.tracksProcessed || 0,
                    duckingEvents: result.duckingEvents || 0,
                    averageDuckingRatio: result.averageDuckingRatio || 0,
                    duckingQuality: result.duckingQuality || 'high'
                },
                duckingData: {
                    duckingCurves: result.duckingCurves || [],
                    volumeReductions: result.volumeReductions || [],
                    timingData: result.timingData || {},
                    duckingConfidence: result.duckingConfidence || 0
                }
            });

        } catch (error) {
            this.logger.error(`[${requestId}] Dynamic ducking configuration failed:`, error);
            
            res.status(500).json({
                error: 'Dynamic ducking configuration failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        } finally {
            if (req.files) {
                await this.fileUtils.cleanupUploadedFiles(req.files);
            }
        }
    }

    /**
     * Configure submix routing for multiple tracks
     */
    async configureSubmixRouting(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            this.logger.info(`[${requestId}] Starting submix routing configuration`, {
                fileCount: req.files?.length || 0
            });

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: 'No audio files provided',
                    requestId
                });
            }

            const options = {
                submixGroups: req.body.submixGroups || {
                    main: { tracks: [], gain: 1.0 },
                    speech: { tracks: [], gain: 1.0 },
                    music: { tracks: [], gain: 1.0 },
                    effects: { tracks: [], gain: 1.0 }
                },
                trackAssignments: req.body.trackAssignments || [],
                enableAutoRouting: req.body.enableAutoRouting !== false,
                outputFormat: req.body.outputFormat || 'mp3',
                quality: req.body.quality || 'high'
            };

            const result = await this.multiTrackService.configureSubmixRouting(req.files, options);
            const processingTime = Date.now() - startTime;
            
            this.logger.info(`[${requestId}] Submix routing configuration completed`, {
                processingTime: `${processingTime}ms`,
                submixGroups: result.submixGroups?.length || 0
            });

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                originalTracks: req.files.map(file => ({
                    name: file.originalname,
                    size: file.size
                })),
                submixGroups: result.submixGroups?.map(group => ({
                    name: group.name,
                    tracks: group.tracks,
                    gain: group.gain,
                    outputFile: group.outputFile,
                    downloadUrl: group.outputFile ? `/temp/${group.outputFile}` : null
                })) || [],
                routingOptions: options,
                results: {
                    submixGroupsCreated: result.submixGroupsCreated || 0,
                    tracksRouted: result.tracksRouted || 0,
                    routingQuality: result.routingQuality || 'high'
                },
                routingData: {
                    trackAssignments: result.trackAssignments || [],
                    gainAdjustments: result.gainAdjustments || [],
                    routingMatrix: result.routingMatrix || {},
                    routingConfidence: result.routingConfidence || 0
                }
            });

        } catch (error) {
            this.logger.error(`[${requestId}] Submix routing configuration failed:`, error);
            
            res.status(500).json({
                error: 'Submix routing configuration failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        } finally {
            if (req.files) {
                await this.fileUtils.cleanupUploadedFiles(req.files);
            }
        }
    }

    /**
     * Get multi-track processing capabilities
     */
    getCapabilities(req, res) {
        try {
            const capabilities = this.multiTrackService.getCapabilities();
            
            res.json({
                success: true,
                capabilities: {
                    maxTracks: capabilities.maxTracks || 6,
                    supportedFormats: capabilities.supportedFormats || [],
                    analysisTypes: capabilities.analysisTypes || [],
                    syncMethods: capabilities.syncMethods || [],
                    submixGroups: capabilities.submixGroups || [],
                    duckingAlgorithms: capabilities.duckingAlgorithms || [],
                    realTimeProcessing: capabilities.realTimeProcessing || false,
                    audioWorkletSupport: capabilities.audioWorkletSupport || false
                }
            });
        } catch (error) {
            this.logger.error('Failed to get multi-track capabilities:', error);
            res.status(500).json({
                error: 'Failed to get capabilities',
                message: error.message
            });
        }
    }

    /**
     * Get status of a long-running multi-track job
     */
    async getJobStatus(req, res) {
        try {
            const { requestId } = req.params;
            const status = await this.multiTrackService.getJobStatus(requestId);
            
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
            this.logger.error('Failed to get job status:', error);
            res.status(500).json({
                error: 'Failed to get job status',
                message: error.message
            });
        }
    }
}

module.exports = MultitrackController;