/**
 * Submix Router - Audio Routing Architecture
 * Manages up to 6 audio tracks through submix routing to work around plugin limitations
 * Supports dynamic routing, gain staging, and cross-track processing
 */

class SubmixRouter {
    constructor(audioContext, maxTracks = 6) {
        this.audioContext = audioContext;
        this.maxTracks = maxTracks;
        
        // Audio nodes and routing
        this.inputGains = [];
        this.submixGains = {};
        this.compressors = {};
        this.limiters = {};
        this.masterGain = null;
        
        // Track management
        this.tracks = new Array(maxTracks).fill(null).map((_, index) => ({
            id: index,
            active: false,
            source: null,
            inputGain: null,
            submix: 'main',
            solo: false,
            mute: false,
            level: -Infinity,
            peakLevel: -Infinity,
            clipCount: 0,
            routing: []
        }));
        
        // Submix configuration
        this.submixes = {
            main: {
                name: 'Main',
                gain: 1.0,
                gainNode: null,
                compressor: null,
                limiter: null,
                tracks: [],
                sends: []
            },
            speech: {
                name: 'Speech/Dialog',
                gain: 1.0,
                gainNode: null,
                compressor: null,
                limiter: null,
                tracks: [],
                sends: []
            },
            music: {
                name: 'Music',
                gain: 1.0,
                gainNode: null,
                compressor: null,
                limiter: null,
                tracks: [],
                sends: []
            },
            effects: {
                name: 'Sound Effects',
                gain: 1.0,
                gainNode: null,
                compressor: null,
                limiter: null,
                tracks: [],
                sends: []
            },
            aux1: {
                name: 'Auxiliary 1',
                gain: 1.0,
                gainNode: null,
                compressor: null,
                limiter: null,
                tracks: [],
                sends: []
            },
            aux2: {
                name: 'Auxiliary 2',
                gain: 1.0,
                gainNode: null,
                compressor: null,
                limiter: null,
                tracks: [],
                sends: []
            }
        };
        
        // Plugin limitation workarounds
        this.pluginWorkarounds = {
            enabled: true,
            maxSimultaneousPlugins: 4,
            pluginPooling: true,
            deferredProcessing: true,
            fallbackProcessing: true
        };
        
        // Processing state
        this.isInitialized = false;
        this.isProcessing = false;
        this.sampleRate = audioContext.sampleRate;
        
        // Event handlers
        this.eventHandlers = {
            'trackLevelChange': [],
            'submixChange': [],
            'routingChange': [],
            'overload': [],
            'clipping': []
        };
        
        this.initializeRouting();
    }
    
    async initializeRouting() {
        try {
            console.log('Initializing submix routing architecture...');
            
            // Create master output gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 1.0;
            this.masterGain.connect(this.audioContext.destination);
            
            // Initialize submix nodes
            await this.initializeSubmixes();
            
            // Initialize track input gains
            this.initializeTrackInputs();
            
            // Setup plugin workaround system
            this.initializePluginWorkarounds();
            
            this.isInitialized = true;
            console.log('Submix routing initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize submix routing:', error);
            throw error;
        }
    }
    
    async initializeSubmixes() {
        for (const [submixName, submix] of Object.entries(this.submixes)) {
            // Create gain node
            submix.gainNode = this.audioContext.createGain();
            submix.gainNode.gain.value = submix.gain;
            
            // Create compressor with submix-specific settings
            submix.compressor = this.audioContext.createDynamicsCompressor();
            
            switch (submixName) {
                case 'speech':
                    submix.compressor.threshold.value = -18;
                    submix.compressor.ratio.value = 4;
                    submix.compressor.attack.value = 0.005;
                    submix.compressor.release.value = 0.1;
                    break;
                case 'music':
                    submix.compressor.threshold.value = -12;
                    submix.compressor.ratio.value = 2.5;
                    submix.compressor.attack.value = 0.01;
                    submix.compressor.release.value = 0.3;
                    break;
                case 'effects':
                    submix.compressor.threshold.value = -15;
                    submix.compressor.ratio.value = 3;
                    submix.compressor.attack.value = 0.003;
                    submix.compressor.release.value = 0.05;
                    break;
                default:
                    submix.compressor.threshold.value = -16;
                    submix.compressor.ratio.value = 3;
                    submix.compressor.attack.value = 0.01;
                    submix.compressor.release.value = 0.1;
            }
            
            // Create limiter (using another compressor with extreme settings)
            submix.limiter = this.audioContext.createDynamicsCompressor();
            submix.limiter.threshold.value = -2;
            submix.limiter.ratio.value = 20;
            submix.limiter.attack.value = 0.001;
            submix.limiter.release.value = 0.01;
            
            // Connect the chain: gain -> compressor -> limiter -> master
            submix.gainNode.connect(submix.compressor);
            submix.compressor.connect(submix.limiter);
            submix.limiter.connect(this.masterGain);
            
            console.log(`Initialized submix: ${submix.name}`);
        }
    }
    
    initializeTrackInputs() {
        for (let i = 0; i < this.maxTracks; i++) {
            const track = this.tracks[i];\n            \n            // Create input gain node\n            track.inputGain = this.audioContext.createGain();\n            track.inputGain.gain.value = 1.0;\n            \n            // Initially route to main submix\n            track.inputGain.connect(this.submixes.main.gainNode);\n            this.submixes.main.tracks.push(i);\n        }\n    }\n    \n    initializePluginWorkarounds() {\n        // Plugin pooling system\n        this.pluginPool = {\n            compressors: [],\n            limiters: [],\n            eqs: [],\n            effects: []\n        };\n        \n        // Pre-create plugin instances to avoid runtime allocation issues\n        if (this.pluginWorkarounds.pluginPooling) {\n            for (let i = 0; i < this.pluginWorkarounds.maxSimultaneousPlugins; i++) {\n                this.pluginPool.compressors.push(this.audioContext.createDynamicsCompressor());\n                // Additional plugin types would be created here\n            }\n        }\n        \n        console.log('Plugin workaround system initialized');\n    }\n    \n    // Track Management\n    connectTrack(trackId, audioNode) {\n        if (trackId < 0 || trackId >= this.maxTracks) {\n            throw new Error(`Track ID ${trackId} out of range (0-${this.maxTracks - 1})`);\n        }\n        \n        const track = this.tracks[trackId];\n        \n        if (track.source) {\n            this.disconnectTrack(trackId);\n        }\n        \n        track.source = audioNode;\n        track.active = true;\n        \n        // Connect to input gain\n        audioNode.connect(track.inputGain);\n        \n        this.emit('routingChange', { trackId, action: 'connected' });\n        \n        console.log(`Track ${trackId} connected and routed to ${track.submix}`);\n        return true;\n    }\n    \n    disconnectTrack(trackId) {\n        if (trackId < 0 || trackId >= this.maxTracks) {\n            return false;\n        }\n        \n        const track = this.tracks[trackId];\n        \n        if (track.source) {\n            track.source.disconnect();\n            track.source = null;\n        }\n        \n        track.active = false;\n        track.level = -Infinity;\n        track.peakLevel = -Infinity;\n        \n        this.emit('routingChange', { trackId, action: 'disconnected' });\n        \n        return true;\n    }\n    \n    // Submix Routing\n    routeTrackToSubmix(trackId, submixName) {\n        if (trackId < 0 || trackId >= this.maxTracks) {\n            throw new Error(`Invalid track ID: ${trackId}`);\n        }\n        \n        if (!this.submixes[submixName]) {\n            throw new Error(`Invalid submix: ${submixName}`);\n        }\n        \n        const track = this.tracks[trackId];\n        const oldSubmix = track.submix;\n        \n        // Disconnect from current submix\n        if (oldSubmix && this.submixes[oldSubmix]) {\n            track.inputGain.disconnect(this.submixes[oldSubmix].gainNode);\n            const trackIndex = this.submixes[oldSubmix].tracks.indexOf(trackId);\n            if (trackIndex > -1) {\n                this.submixes[oldSubmix].tracks.splice(trackIndex, 1);\n            }\n        }\n        \n        // Connect to new submix\n        track.submix = submixName;\n        track.inputGain.connect(this.submixes[submixName].gainNode);\n        this.submixes[submixName].tracks.push(trackId);\n        \n        this.emit('submixChange', { trackId, oldSubmix, newSubmix: submixName });\n        \n        console.log(`Track ${trackId} routed from ${oldSubmix} to ${submixName}`);\n        return true;\n    }\n    \n    createSend(trackId, submixName, sendLevel = 0.5) {\n        if (!this.tracks[trackId] || !this.submixes[submixName]) {\n            return false;\n        }\n        \n        const track = this.tracks[trackId];\n        \n        // Create send gain\n        const sendGain = this.audioContext.createGain();\n        sendGain.gain.value = sendLevel;\n        \n        // Connect: track input -> send gain -> target submix\n        track.inputGain.connect(sendGain);\n        sendGain.connect(this.submixes[submixName].gainNode);\n        \n        // Track the send\n        track.routing.push({\n            type: 'send',\n            target: submixName,\n            gainNode: sendGain,\n            level: sendLevel\n        });\n        \n        console.log(`Created send from track ${trackId} to ${submixName} at level ${sendLevel}`);\n        return true;\n    }\n    \n    // Level Control\n    setTrackGain(trackId, gain) {\n        if (this.tracks[trackId] && this.tracks[trackId].inputGain) {\n            this.tracks[trackId].inputGain.gain.value = gain;\n            return true;\n        }\n        return false;\n    }\n    \n    setSubmixGain(submixName, gain) {\n        if (this.submixes[submixName] && this.submixes[submixName].gainNode) {\n            this.submixes[submixName].gain = gain;\n            this.submixes[submixName].gainNode.gain.value = gain;\n            return true;\n        }\n        return false;\n    }\n    \n    setMasterGain(gain) {\n        if (this.masterGain) {\n            this.masterGain.gain.value = gain;\n            return true;\n        }\n        return false;\n    }\n    \n    // Solo/Mute functionality\n    soloTrack(trackId, solo = true) {\n        if (!this.tracks[trackId]) return false;\n        \n        this.tracks[trackId].solo = solo;\n        \n        // If any track is soloed, mute all non-soloed tracks\n        const hasSolo = this.tracks.some(track => track.solo);\n        \n        this.tracks.forEach((track, id) => {\n            if (track.active && track.inputGain) {\n                const shouldMute = hasSolo ? !track.solo : track.mute;\n                track.inputGain.gain.value = shouldMute ? 0 : 1;\n            }\n        });\n        \n        return true;\n    }\n    \n    muteTrack(trackId, mute = true) {\n        if (!this.tracks[trackId]) return false;\n        \n        this.tracks[trackId].mute = mute;\n        \n        // Re-evaluate solo/mute state\n        this.soloTrack(-1, false); // Trigger solo recalculation\n        \n        return true;\n    }\n    \n    // Plugin Limitation Workarounds\n    async applyPluginWithWorkaround(trackId, pluginType, settings) {\n        if (!this.pluginWorkarounds.enabled) {\n            return this.applyPluginDirect(trackId, pluginType, settings);\n        }\n        \n        try {\n            // Check if we've hit plugin limits\n            if (this.getActivePluginCount() >= this.pluginWorkarounds.maxSimultaneousPlugins) {\n                if (this.pluginWorkarounds.deferredProcessing) {\n                    return this.schedulePluginDeferred(trackId, pluginType, settings);\n                } else if (this.pluginWorkarounds.fallbackProcessing) {\n                    return this.applyPluginFallback(trackId, pluginType, settings);\n                }\n            }\n            \n            // Use plugin pooling if available\n            if (this.pluginWorkarounds.pluginPooling) {\n                return this.applyPluginFromPool(trackId, pluginType, settings);\n            }\n            \n            return this.applyPluginDirect(trackId, pluginType, settings);\n            \n        } catch (error) {\n            console.warn(`Plugin application failed, using fallback: ${error.message}`);\n            return this.applyPluginFallback(trackId, pluginType, settings);\n        }\n    }\n    \n    applyPluginDirect(trackId, pluginType, settings) {\n        // Direct plugin application without workarounds\n        const track = this.tracks[trackId];\n        if (!track || !track.inputGain) return false;\n        \n        let pluginNode;\n        \n        switch (pluginType) {\n            case 'compressor':\n                pluginNode = this.audioContext.createDynamicsCompressor();\n                Object.assign(pluginNode, settings);\n                break;\n            case 'filter':\n                pluginNode = this.audioContext.createBiquadFilter();\n                Object.assign(pluginNode, settings);\n                break;\n            default:\n                console.warn(`Unknown plugin type: ${pluginType}`);\n                return false;\n        }\n        \n        // Insert into signal chain\n        track.inputGain.disconnect();\n        track.inputGain.connect(pluginNode);\n        pluginNode.connect(this.submixes[track.submix].gainNode);\n        \n        return true;\n    }\n    \n    applyPluginFromPool(trackId, pluginType, settings) {\n        const poolArray = this.pluginPool[pluginType + 's'];\n        if (!poolArray || poolArray.length === 0) {\n            return this.applyPluginDirect(trackId, pluginType, settings);\n        }\n        \n        const pluginNode = poolArray.pop();\n        Object.assign(pluginNode, settings);\n        \n        const track = this.tracks[trackId];\n        track.inputGain.disconnect();\n        track.inputGain.connect(pluginNode);\n        pluginNode.connect(this.submixes[track.submix].gainNode);\n        \n        // Return to pool when done\n        setTimeout(() => {\n            pluginNode.disconnect();\n            poolArray.push(pluginNode);\n        }, 1000); // Simplified cleanup\n        \n        return true;\n    }\n    \n    schedulePluginDeferred(trackId, pluginType, settings) {\n        // Schedule plugin application for later when resources are available\n        setTimeout(() => {\n            if (this.getActivePluginCount() < this.pluginWorkarounds.maxSimultaneousPlugins) {\n                this.applyPluginDirect(trackId, pluginType, settings);\n            }\n        }, 100);\n        \n        return true;\n    }\n    \n    applyPluginFallback(trackId, pluginType, settings) {\n        // Simplified fallback processing\n        console.log(`Using fallback processing for ${pluginType} on track ${trackId}`);\n        \n        switch (pluginType) {\n            case 'compressor':\n                // Use submix compressor instead\n                const track = this.tracks[trackId];\n                const submix = this.submixes[track.submix];\n                if (submix.compressor) {\n                    Object.assign(submix.compressor, settings);\n                }\n                break;\n            default:\n                console.warn(`No fallback available for ${pluginType}`);\n        }\n        \n        return true;\n    }\n    \n    getActivePluginCount() {\n        // Simplified plugin counting - in real implementation, track active plugins\n        return Object.values(this.submixes).filter(submix => \n            submix.compressor || submix.limiter\n        ).length;\n    }\n    \n    // Analysis and Monitoring\n    startLevelMonitoring() {\n        const analyzeLevel = () => {\n            this.tracks.forEach((track, id) => {\n                if (track.active && track.inputGain) {\n                    // In a real implementation, use AnalyserNode\n                    // This is a simplified version\n                    const level = this.calculateTrackLevel(id);\n                    \n                    if (level !== track.level) {\n                        track.level = level;\n                        track.peakLevel = Math.max(track.peakLevel, level);\n                        \n                        // Check for clipping\n                        if (level > -0.1) {\n                            track.clipCount++;\n                            this.emit('clipping', { trackId: id, level });\n                        }\n                        \n                        this.emit('trackLevelChange', { trackId: id, level, peakLevel: track.peakLevel });\n                    }\n                }\n            });\n            \n            if (this.isProcessing) {\n                requestAnimationFrame(analyzeLevel);\n            }\n        };\n        \n        this.isProcessing = true;\n        analyzeLevel();\n    }\n    \n    stopLevelMonitoring() {\n        this.isProcessing = false;\n    }\n    \n    calculateTrackLevel(trackId) {\n        // Simplified level calculation\n        // In real implementation, use Web Audio API's AnalyserNode\n        const track = this.tracks[trackId];\n        if (!track.active) return -Infinity;\n        \n        // Simulate level calculation\n        return -20 + (Math.random() * 40); // Random level between -60dB and +20dB\n    }\n    \n    // Event System\n    on(event, handler) {\n        if (!this.eventHandlers[event]) {\n            this.eventHandlers[event] = [];\n        }\n        this.eventHandlers[event].push(handler);\n    }\n    \n    off(event, handler) {\n        if (this.eventHandlers[event]) {\n            const index = this.eventHandlers[event].indexOf(handler);\n            if (index > -1) {\n                this.eventHandlers[event].splice(index, 1);\n            }\n        }\n    }\n    \n    emit(event, data) {\n        if (this.eventHandlers[event]) {\n            this.eventHandlers[event].forEach(handler => {\n                try {\n                    handler(data);\n                } catch (error) {\n                    console.error(`Error in event handler for ${event}:`, error);\n                }\n            });\n        }\n    }\n    \n    // Status and Information\n    getStatus() {\n        return {\n            isInitialized: this.isInitialized,\n            isProcessing: this.isProcessing,\n            maxTracks: this.maxTracks,\n            activeTracks: this.tracks.filter(track => track.active).length,\n            submixes: Object.keys(this.submixes).map(name => ({\n                name,\n                displayName: this.submixes[name].name,\n                gain: this.submixes[name].gain,\n                trackCount: this.submixes[name].tracks.length,\n                tracks: this.submixes[name].tracks\n            })),\n            pluginWorkarounds: this.pluginWorkarounds,\n            activePlugins: this.getActivePluginCount()\n        };\n    }\n    \n    getTrackInfo(trackId) {\n        if (trackId < 0 || trackId >= this.maxTracks) {\n            return null;\n        }\n        \n        const track = this.tracks[trackId];\n        return {\n            id: trackId,\n            active: track.active,\n            submix: track.submix,\n            solo: track.solo,\n            mute: track.mute,\n            level: track.level,\n            peakLevel: track.peakLevel,\n            clipCount: track.clipCount,\n            routing: track.routing\n        };\n    }\n    \n    // Cleanup\n    destroy() {\n        this.stopLevelMonitoring();\n        \n        // Disconnect all tracks\n        for (let i = 0; i < this.maxTracks; i++) {\n            this.disconnectTrack(i);\n        }\n        \n        // Disconnect submixes\n        Object.values(this.submixes).forEach(submix => {\n            if (submix.gainNode) {\n                submix.gainNode.disconnect();\n            }\n            if (submix.compressor) {\n                submix.compressor.disconnect();\n            }\n            if (submix.limiter) {\n                submix.limiter.disconnect();\n            }\n        });\n        \n        if (this.masterGain) {\n            this.masterGain.disconnect();\n        }\n        \n        console.log('Submix router destroyed');\n    }\n}\n\nexport default SubmixRouter;"
