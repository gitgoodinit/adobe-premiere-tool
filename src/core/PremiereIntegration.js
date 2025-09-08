/**
 * Premiere Pro Integration - ExtendScript Backend
 * Handles non-destructive silence trimming through adjustment layers and fade curves
 */

class PremiereIntegration {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        this.csInterface = new CSInterface();
        this.premiereVersion = this.getPremiereVersion();
        this.activeSequence = null;
        this.trimOperations = [];
        
        this.initializeExtendScript();
    }

    // ========================================
    // INITIALIZATION & SETUP
    // ========================================

    initializeExtendScript() {
        this.app.log('🎬 Initializing Premiere Pro ExtendScript integration...', 'info');
        
        try {
            // Load ExtendScript library
            this.loadExtendScriptLibrary();
            
            // Check Premiere Pro connection
            this.validatePremiereConnection();
            
            // Get active sequence
            this.refreshActiveSequence();
            
            this.app.log('✅ Premiere Pro integration ready', 'success');
            
        } catch (error) {
            this.app.log(`❌ Premiere Pro integration failed: ${error.message}`, 'error');
            throw error;
        }
    }

    loadExtendScriptLibrary() {
        // Load our custom ExtendScript functions
        const extendScriptCode = this.getExtendScriptLibrary();
        
        this.csInterface.evalScript(extendScriptCode, (result) => {
            if (result === 'EvalScript_ErrMessage') {
                throw new Error('Failed to load ExtendScript library');
            }
            this.app.log('📜 ExtendScript library loaded', 'info');
        });
    }

    validatePremiereConnection() {
        return new Promise((resolve, reject) => {
            this.csInterface.evalScript('app.name', (result) => {
                if (result && result.includes('Premiere')) {
                    this.app.log(`🎬 Connected to ${result}`, 'info');
                    resolve(result);
                } else {
                    reject(new Error('Premiere Pro not detected or not responding'));
                }
            });
        });
    }

    refreshActiveSequence() {
        return new Promise((resolve, reject) => {
            this.csInterface.evalScript('getActiveSequenceInfo()', (result) => {
                try {
                    const sequenceInfo = JSON.parse(result);
                    if (sequenceInfo.success) {
                        this.activeSequence = sequenceInfo.sequence;
                        this.app.log(`📽️ Active sequence: ${sequenceInfo.sequence.name}`, 'info');
                        resolve(sequenceInfo.sequence);
                    } else {
                        reject(new Error('No active sequence found'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse sequence information'));
                }
            });
        });
    }

    // ========================================
    // NON-DESTRUCTIVE SILENCE TRIMMING
    // ========================================

    async applySilenceTrimming(silenceSegments, options = {}) {
        this.app.log('✂️ Applying non-destructive silence trimming...', 'info');
        this.app.updateStatus('Applying Edits...', 'processing');
        
        try {
            const trimOptions = {
                method: options.method || 'adjustmentLayers', // 'adjustmentLayers', 'fadeCurves', 'markers'
                preserveOriginal: options.preserveOriginal !== false,
                fadeTransition: options.fadeTransition || 0.1, // seconds
                minGapDuration: options.minGapDuration || 0.3,
                trackTargets: options.trackTargets || 'selected'
            };

            const results = [];

            for (let i = 0; i < silenceSegments.length; i++) {
                const segment = silenceSegments[i];
                this.app.updateProgressBar(70 + (i / silenceSegments.length) * 25, 
                    `Processing segment ${i + 1}/${silenceSegments.length}`);

                let result;
                switch (trimOptions.method) {
                    case 'adjustmentLayers':
                        result = await this.trimWithAdjustmentLayers(segment, trimOptions);
                        break;
                    case 'fadeCurves':
                        result = await this.trimWithFadeCurves(segment, trimOptions);
                        break;
                    case 'markers':
                        result = await this.addSilenceMarkers(segment, trimOptions);
                        break;
                    default:
                        throw new Error(`Unknown trim method: ${trimOptions.method}`);
                }

                results.push(result);
                this.trimOperations.push({
                    segment,
                    method: trimOptions.method,
                    result,
                    timestamp: new Date()
                });
            }

            this.app.log(`✅ Applied ${results.length} silence trims successfully`, 'success');
            this.app.updateStatus('Trimming Complete', 'success');

            return {
                success: true,
                appliedTrims: results.length,
                operations: this.trimOperations.slice(-results.length),
                method: trimOptions.method
            };

        } catch (error) {
            this.app.log(`❌ Silence trimming failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========================================
    // ADJUSTMENT LAYERS METHOD
    // ========================================

    async trimWithAdjustmentLayers(segment, options) {
        this.app.log(`🎭 Creating adjustment layer for silence at ${segment.start.toFixed(2)}s`, 'info');
        
        return new Promise((resolve, reject) => {
            const adjustmentLayerScript = `
                createSilenceAdjustmentLayer({
                    startTime: ${segment.start},
                    endTime: ${segment.end},
                    fadeTransition: ${options.fadeTransition},
                    trackTargets: "${options.trackTargets}"
                })
            `;
            
            this.csInterface.evalScript(adjustmentLayerScript, (result) => {
                try {
                    const layerResult = JSON.parse(result);
                    if (layerResult.success) {
                        this.app.log(`✅ Adjustment layer created: ${layerResult.layerName}`, 'success');
                        resolve({
                            type: 'adjustmentLayer',
                            layerName: layerResult.layerName,
                            trackIndex: layerResult.trackIndex,
                            segment: segment,
                            reversible: true
                        });
                    } else {
                        reject(new Error(layerResult.error || 'Failed to create adjustment layer'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse adjustment layer result'));
                }
            });
        });
    }

    // ========================================
    // FADE CURVES METHOD
    // ========================================

    async trimWithFadeCurves(segment, options) {
        this.app.log(`🌊 Applying fade curves for silence at ${segment.start.toFixed(2)}s`, 'info');
        
        return new Promise((resolve, reject) => {
            const fadeCurveScript = `
                applySilenceFadeCurves({
                    startTime: ${segment.start},
                    endTime: ${segment.end},
                    fadeTransition: ${options.fadeTransition},
                    trackTargets: "${options.trackTargets}",
                    preserveOriginal: ${options.preserveOriginal}
                })
            `;
            
            this.csInterface.evalScript(fadeCurveScript, (result) => {
                try {
                    const fadeResult = JSON.parse(result);
                    if (fadeResult.success) {
                        this.app.log(`✅ Fade curves applied to ${fadeResult.affectedClips} clips`, 'success');
                        resolve({
                            type: 'fadeCurves',
                            affectedClips: fadeResult.affectedClips,
                            keyframes: fadeResult.keyframes,
                            segment: segment,
                            reversible: true
                        });
                    } else {
                        reject(new Error(fadeResult.error || 'Failed to apply fade curves'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse fade curve result'));
                }
            });
        });
    }

    // ========================================
    // MARKERS METHOD
    // ========================================

    async addSilenceMarkers(segment, options) {
        this.app.log(`📍 Adding silence marker at ${segment.start.toFixed(2)}s`, 'info');
        
        return new Promise((resolve, reject) => {
            const markerScript = `
                addSilenceMarker({
                    startTime: ${segment.start},
                    endTime: ${segment.end},
                    duration: ${segment.duration},
                    confidence: ${segment.confidence},
                    method: "${segment.method}",
                    color: "red"
                })
            `;
            
            this.csInterface.evalScript(markerScript, (result) => {
                try {
                    const markerResult = JSON.parse(result);
                    if (markerResult.success) {
                        this.app.log(`✅ Silence marker added: ${markerResult.markerName}`, 'success');
                        resolve({
                            type: 'marker',
                            markerName: markerResult.markerName,
                            markerId: markerResult.markerId,
                            segment: segment,
                            reversible: true
                        });
                    } else {
                        reject(new Error(markerResult.error || 'Failed to add marker'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse marker result'));
                }
            });
        });
    }

    // ========================================
    // UNDO/REDO FUNCTIONALITY
    // ========================================

    async undoLastTrimOperation() {
        if (this.trimOperations.length === 0) {
            this.app.log('⚠️ No trim operations to undo', 'warning');
            return false;
        }
        
        const lastOperation = this.trimOperations[this.trimOperations.length - 1];
        this.app.log(`↩️ Undoing ${lastOperation.method} operation...`, 'info');
        
        try {
            let undoScript;
            
            switch (lastOperation.result.type) {
                case 'adjustmentLayer':
                    undoScript = `removeAdjustmentLayer("${lastOperation.result.layerName}")`;
                    break;
                case 'fadeCurves':
                    undoScript = `removeFadeCurves(${JSON.stringify(lastOperation.result.keyframes)})`;
                    break;
                case 'marker':
                    undoScript = `removeMarker("${lastOperation.result.markerId}")`;
                    break;
                default:
                    throw new Error(`Unknown operation type: ${lastOperation.result.type}`);
            }
            
            return new Promise((resolve, reject) => {
                this.csInterface.evalScript(undoScript, (result) => {
                    try {
                        const undoResult = JSON.parse(result);
                        if (undoResult.success) {
                            this.trimOperations.pop();
                            this.app.log('✅ Trim operation undone successfully', 'success');
                            resolve(true);
                        } else {
                            reject(new Error(undoResult.error || 'Failed to undo operation'));
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse undo result'));
                    }
                });
            });
            
        } catch (error) {
            this.app.log(`❌ Undo failed: ${error.message}`, 'error');
            return false;
        }
    }

    async undoAllTrimOperations() {
        this.app.log('↩️ Undoing all trim operations...', 'info');
        
        const undoPromises = [];
        while (this.trimOperations.length > 0) {
            undoPromises.push(this.undoLastTrimOperation());
        }
        
        const results = await Promise.all(undoPromises);
        const successful = results.filter(r => r === true).length;
        
        this.app.log(`✅ Undone ${successful}/${results.length} operations`, 'success');
        return successful === results.length;
    }

    // ========================================
    // EXTENDSCRIPT LIBRARY
    // ========================================

    getExtendScriptLibrary() {
        return `
            // Audio Tools Pro ExtendScript Library
            
            function getActiveSequenceInfo() {
                try {
                    if (!app.project.activeSequence) {
                        return JSON.stringify({success: false, error: "No active sequence"});
                    }
                    
                    var seq = app.project.activeSequence;
                    return JSON.stringify({
                        success: true,
                        sequence: {
                            name: seq.name,
                            timebase: seq.timebase,
                            frameRate: seq.framerate,
                            duration: seq.end.seconds,
                            audioTracks: seq.audioTracks.numTracks,
                            videoTracks: seq.videoTracks.numTracks
                        }
                    });
                } catch (error) {
                    return JSON.stringify({success: false, error: error.toString()});
                }
            }
            
            function createSilenceAdjustmentLayer(params) {
                try {
                    var seq = app.project.activeSequence;
                    if (!seq) {
                        return JSON.stringify({success: false, error: "No active sequence"});
                    }
                    
                    // Create adjustment layer
                    var adjustmentLayer = seq.insertAdjustmentLayer(
                        app.project.rootItem, // parent bin
                        seq.timebase * params.startTime, // in point
                        seq.timebase * params.endTime     // out point
                    );
                    
                    // Apply volume effect to make it silent
                    var volumeEffect = adjustmentLayer.components.addVideoEffect(
                        app.anywhere.getAudioEffectByName("Volume")
                    );
                    
                    if (volumeEffect) {
                        // Set volume to -60dB (essentially silent)
                        var levelProperty = volumeEffect.properties.getParamForDisplayName("Level");
                        if (levelProperty) {
                            levelProperty.setValue(-60.0, true);
                        }
                    }
                    
                    // Add fade transitions if specified
                    if (params.fadeTransition > 0) {
                        addFadeToAdjustmentLayer(adjustmentLayer, params.fadeTransition);
                    }
                    
                    return JSON.stringify({
                        success: true,
                        layerName: adjustmentLayer.name,
                        trackIndex: adjustmentLayer.videoTrack.id
                    });
                    
                } catch (error) {
                    return JSON.stringify({success: false, error: error.toString()});
                }
            }
            
            function applySilenceFadeCurves(params) {
                try {
                    var seq = app.project.activeSequence;
                    if (!seq) {
                        return JSON.stringify({success: false, error: "No active sequence"});
                    }
                    
                    var affectedClips = 0;
                    var keyframes = [];
                    var startTicks = seq.timebase * params.startTime;
                    var endTicks = seq.timebase * params.endTime;
                    var fadeTicksDuration = seq.timebase * params.fadeTransition;
                    
                    // Process audio tracks
                    for (var trackIndex = 0; trackIndex < seq.audioTracks.numTracks; trackIndex++) {
                        var track = seq.audioTracks[trackIndex];
                        
                        // Find clips that overlap with the silence segment
                        for (var clipIndex = 0; clipIndex < track.clips.numItems; clipIndex++) {
                            var clip = track.clips[clipIndex];
                            
                            if (clip.end.ticks > startTicks && clip.start.ticks < endTicks) {
                                // Clip overlaps with silence segment
                                var volumeComponent = clip.components.getItemByName("Volume");
                                if (!volumeComponent) {
                                    volumeComponent = clip.components.addAudioEffect(
                                        app.anywhere.getAudioEffectByName("Volume")
                                    );
                                }
                                
                                if (volumeComponent) {
                                    var levelProperty = volumeComponent.properties.getParamForDisplayName("Level");
                                    if (levelProperty) {
                                        // Add keyframes for fade out, silence, fade in
                                        levelProperty.addKey(startTicks - fadeTicksDuration);
                                        levelProperty.setValueAtKey(startTicks - fadeTicksDuration, 0.0, true);
                                        
                                        levelProperty.addKey(startTicks);
                                        levelProperty.setValueAtKey(startTicks, -60.0, true);
                                        
                                        levelProperty.addKey(endTicks);
                                        levelProperty.setValueAtKey(endTicks, -60.0, true);
                                        
                                        levelProperty.addKey(endTicks + fadeTicksDuration);
                                        levelProperty.setValueAtKey(endTicks + fadeTicksDuration, 0.0, true);
                                        
                                        keyframes.push({
                                            clipName: clip.name,
                                            trackIndex: trackIndex,
                                            keyframeCount: 4
                                        });
                                        
                                        affectedClips++;
                                    }
                                }
                            }
                        }
                    }
                    
                    return JSON.stringify({
                        success: true,
                        affectedClips: affectedClips,
                        keyframes: keyframes
                    });
                    
                } catch (error) {
                    return JSON.stringify({success: false, error: error.toString()});
                }
            }
            
            function addSilenceMarker(params) {
                try {
                    var seq = app.project.activeSequence;
                    if (!seq) {
                        return JSON.stringify({success: false, error: "No active sequence"});
                    }
                    
                    var startTicks = seq.timebase * params.startTime;
                    var markerName = "Silence " + params.startTime.toFixed(2) + "s";
                    var comment = "Duration: " + params.duration.toFixed(2) + "s, " +
                                 "Confidence: " + (params.confidence * 100).toFixed(1) + "%, " +
                                 "Method: " + params.method;
                    
                    var marker = seq.markers.createMarker(startTicks);
                    marker.name = markerName;
                    marker.comments = comment;
                    marker.setColorByIndex(2); // Red color
                    
                    return JSON.stringify({
                        success: true,
                        markerName: markerName,
                        markerId: marker.guid
                    });
                    
                } catch (error) {
                    return JSON.stringify({success: false, error: error.toString()});
                }
            }
            
            function removeAdjustmentLayer(layerName) {
                try {
                    var seq = app.project.activeSequence;
                    if (!seq) {
                        return JSON.stringify({success: false, error: "No active sequence"});
                    }
                    
                    // Find and remove the adjustment layer
                    for (var trackIndex = 0; trackIndex < seq.videoTracks.numTracks; trackIndex++) {
                        var track = seq.videoTracks[trackIndex];
                        for (var clipIndex = 0; clipIndex < track.clips.numItems; clipIndex++) {
                            var clip = track.clips[clipIndex];
                            if (clip.name === layerName) {
                                clip.remove(false, true); // ripple delete
                                return JSON.stringify({success: true});
                            }
                        }
                    }
                    
                    return JSON.stringify({success: false, error: "Adjustment layer not found"});
                    
                } catch (error) {
                    return JSON.stringify({success: false, error: error.toString()});
                }
            }
            
            function removeFadeCurves(keyframeData) {
                try {
                    var seq = app.project.activeSequence;
                    if (!seq) {
                        return JSON.stringify({success: false, error: "No active sequence"});
                    }
                    
                    var removedCount = 0;
                    
                    for (var i = 0; i < keyframeData.length; i++) {
                        var kfData = keyframeData[i];
                        var track = seq.audioTracks[kfData.trackIndex];
                        
                        for (var clipIndex = 0; clipIndex < track.clips.numItems; clipIndex++) {
                            var clip = track.clips[clipIndex];
                            if (clip.name === kfData.clipName) {
                                var volumeComponent = clip.components.getItemByName("Volume");
                                if (volumeComponent) {
                                    var levelProperty = volumeComponent.properties.getParamForDisplayName("Level");
                                    if (levelProperty) {
                                        // Remove all keyframes for this property
                                        levelProperty.clearKeyframes();
                                        removedCount++;
                                    }
                                }
                                break;
                            }
                        }
                    }
                    
                    return JSON.stringify({success: true, removedCount: removedCount});
                    
                } catch (error) {
                    return JSON.stringify({success: false, error: error.toString()});
                }
            }
            
            function removeMarker(markerId) {
                try {
                    var seq = app.project.activeSequence;
                    if (!seq) {
                        return JSON.stringify({success: false, error: "No active sequence"});
                    }
                    
                    for (var i = 0; i < seq.markers.numMarkers; i++) {
                        var marker = seq.markers[i];
                        if (marker.guid === markerId) {
                            marker.remove();
                            return JSON.stringify({success: true});
                        }
                    }
                    
                    return JSON.stringify({success: false, error: "Marker not found"});
                    
                } catch (error) {
                    return JSON.stringify({success: false, error: error.toString()});
                }
            }
            
            // Helper function to add fade transitions to adjustment layers
            function addFadeToAdjustmentLayer(layer, fadeDuration) {
                try {
                    var fadeFrames = layer.projectItem.sequence.timebase * fadeDuration;
                    
                    // Add opacity keyframes for fade in/out
                    var opacityProperty = layer.components[0].properties.getParamForDisplayName("Opacity");
                    if (opacityProperty) {
                        opacityProperty.addKey(layer.start.ticks);
                        opacityProperty.setValueAtKey(layer.start.ticks, 100.0, true);
                        
                        opacityProperty.addKey(layer.start.ticks + fadeFrames);
                        opacityProperty.setValueAtKey(layer.start.ticks + fadeFrames, 0.0, true);
                        
                        opacityProperty.addKey(layer.end.ticks - fadeFrames);
                        opacityProperty.setValueAtKey(layer.end.ticks - fadeFrames, 0.0, true);
                        
                        opacityProperty.addKey(layer.end.ticks);
                        opacityProperty.setValueAtKey(layer.end.ticks, 100.0, true);
                    }
                } catch (error) {
                    // Fade addition failed, but not critical
                }
            }
        `;
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    getPremiereVersion() {
        return new Promise((resolve) => {
            this.csInterface.getApplications((apps) => {
                const premiere = apps.find(app => app.appName === 'PPRO');
                resolve(premiere ? premiere.appVersion : 'Unknown');
            });
        });
    }

    getTrimOperationHistory() {
        return [...this.trimOperations];
    }

    clearTrimOperationHistory() {
        this.trimOperations = [];
        this.app.log('🗑️ Trim operation history cleared', 'info');
    }

    // Export settings for debugging
    exportDebugInfo() {
        return {
            premiereVersion: this.premiereVersion,
            activeSequence: this.activeSequence,
            trimOperationCount: this.trimOperations.length,
            csInterfaceVersion: this.csInterface.getOSInformation()
        };
    }
}

module.exports = PremiereIntegration; 