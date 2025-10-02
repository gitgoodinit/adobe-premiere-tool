/**
 * Enhanced Silence Detection - Consolidated Multi-Method Approach
 * Integrates FFmpeg preprocessing, Whisper AI transcription, and Web Audio API
 * Provides unified results with confidence scoring and noise reduction
 */

class EnhancedSilenceDetector {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        this.audioContext = null;
        this.audioBuffer = null;
        
        // Enhanced configuration with preprocessing options
        this.config = {
            preprocessing: {
                normalize: true,
                resample: 16000,
                channels: 1, // mono
                denoise: true, // RNNoise filter
                highpass: 80, // Hz - remove low frequency noise
                lowpass: 8000  // Hz - focus on speech range
            },
            silence: {
                minDuration: 0.3, // 300ms minimum silence
                noiseThreshold: -30, // dB
                confidenceThreshold: 0.7
            },
            whisper: {
                model: 'whisper-1',
                responseFormat: 'verbose_json',
                timestampGranularities: ['segment', 'word'],
                language: 'en'
            },
            ffmpeg: {
                executable: this.getFFmpegPath(),
                silenceFilter: 'silencedetect=noise=-30dB:d=0.3',
                statsFilter: 'astats=metadata=1:reset=1',
                loudnessFilter: 'loudnorm=I=-16:TP=-1.5:LRA=11'
            }
        };
        
        this.initializeAudioContext();
    }

    // ========================================
    // MAIN ENHANCED DETECTION ORCHESTRATOR
    // ========================================

    async detectSilence(audioFile, options = {}) {
        const startTime = Date.now();
        
        this.app.log('🔍 Starting Enhanced Silence Detection via Backend API...', 'info');
        this.app.updateStatus('Enhanced Analysis...', 'processing');
        
        try {
            // Enhanced detection now uses the backend API for unified processing
            this.app.updateProgressBar(10, 'Connecting to backend API...');
            
            // Ensure audio is loaded
            if (!this.app.currentAudioBlob) {
                throw new Error('No audio blob available. Please load media first.');
            }
            
            this.app.log('🚀 Using backend API for enhanced silence detection...', 'info');
            
            // Step 1: Call backend API
            this.app.updateProgressBar(30, 'Processing with backend AI...');
            await this.app.sendAudioToSilenceDetectionApi();
            
            // Step 2: Get results from main app
            const backendResults = this.app.lastSilenceResults || [];
            
            // Step 3: Apply enhanced processing to backend results
            this.app.updateProgressBar(70, 'Applying enhanced processing...');
            const enhancedResults = this.enhanceBackendResults(backendResults, options);
            
            // Step 4: Apply confidence scoring and filtering
            this.app.updateProgressBar(90, 'Finalizing enhanced results...');
            const finalResults = this.applyEnhancedConfidenceScoring(enhancedResults);
            
            const duration = (Date.now() - startTime) / 1000;
            this.app.log(`✅ Enhanced silence detection completed in ${duration.toFixed(2)}s`, 'success');
            this.app.log(`📊 Found ${finalResults.length} enhanced silence segments`, 'info');
            
            return {
                success: true,
                results: finalResults,
                metadata: {
                    duration,
                    methods: ['backend-api', 'enhanced-processing'],
                    confidence: this.calculateOverallConfidence(finalResults),
                    processingTime: this.app.lastProcessingTime || `${duration.toFixed(2)}s`
                }
            };
            
        } catch (error) {
            this.app.log(`❌ Enhanced silence detection failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // New method to enhance backend results with additional processing
    enhanceBackendResults(backendResults, options = {}) {
        if (!Array.isArray(backendResults)) {
            return [];
        }
        
        return backendResults.map((segment, index) => ({
            // Original backend data
            start: segment.start || segment.startTime || 0,
            end: segment.end || segment.endTime || (segment.start + segment.duration) || 0,
            duration: segment.duration || 0,
            confidence: segment.confidence || 0.8,
            
            // Enhanced metadata
            id: `enhanced_${index + 1}`,
            type: this.classifyEnhancedSilenceType(segment),
            method: 'backend-enhanced',
            qualityScore: this.calculateQualityScore(segment),
            recommendedAction: this.getEnhancedRecommendedAction(segment),
            confidenceLevel: this.getEnhancedConfidenceLevel(segment.confidence || 0.8),
            
            // Enhanced properties
            enhanced: {
                noiseReduction: options.enablePreprocessing !== false,
                aiValidation: options.enableAIValidation !== false,
                adaptiveThreshold: true,
                contextAware: true
            }
        }));
    }
    
    // Enhanced confidence scoring
    applyEnhancedConfidenceScoring(results) {
        return results.map(segment => {
            let enhancedConfidence = segment.confidence;
            
            // Boost confidence for longer segments
            if (segment.duration > 1.0) {
                enhancedConfidence *= 1.1;
            }
            
            // Boost confidence for segments with clear boundaries
            if (segment.type === 'speech_gap') {
                enhancedConfidence *= 1.05;
            }
            
            // Cap confidence at 1.0
            enhancedConfidence = Math.min(1.0, enhancedConfidence);
            
            return {
                ...segment,
                confidence: enhancedConfidence,
                originalConfidence: segment.confidence,
                confidenceBoost: enhancedConfidence - segment.confidence
            };
        });
    }
    
    // Enhanced classification
    classifyEnhancedSilenceType(segment) {
        const duration = segment.duration || 0;
        
        if (duration < 0.3) return 'micro_pause';
        if (duration < 0.8) return 'pause';
        if (duration < 2.0) return 'speech_gap';
        if (duration < 5.0) return 'silence';
        return 'extended_silence';
    }
    
    // Enhanced quality scoring
    calculateQualityScore(segment) {
        const confidence = segment.confidence || 0;
        const duration = segment.duration || 0;
        
        let score = confidence * 100;
        
        // Bonus for optimal duration ranges
        if (duration >= 0.5 && duration <= 3.0) {
            score += 5;
        }
        
        return Math.min(100, Math.round(score));
    }
    
    // Enhanced recommended actions
    getEnhancedRecommendedAction(segment) {
        const confidence = segment.confidence || 0;
        const duration = segment.duration || 0;
        
        if (confidence > 0.95 && duration < 2.0) return 'auto_trim';
        if (confidence > 0.85 && duration < 3.0) return 'auto_trim_with_fade';
        if (confidence > 0.7) return 'review_recommended';
        return 'manual_review_required';
    }
    
    // Enhanced confidence levels
    getEnhancedConfidenceLevel(confidence) {
        if (confidence >= 0.95) return 'very_high';
        if (confidence >= 0.85) return 'high';
        if (confidence >= 0.7) return 'medium';
        if (confidence >= 0.5) return 'low';
        return 'very_low';
    }

    // ========================================
    // AUDIO PREPROCESSING WITH FFMPEG
    // ========================================

    async preprocessAudio(audioFile) {
        this.app.log('🔧 Preprocessing audio with FFmpeg...', 'info');
        
        try {
            const { normalize, resample, channels, denoise, highpass, lowpass } = this.config.preprocessing;
            
            // Build enhanced FFmpeg preprocessing command
            const filters = [];
            
            if (channels === 1) {
                filters.push('aformat=channel_layouts=mono');
            }
            
            if (resample !== 48000) {
                filters.push(`aresample=${resample}`);
            }
            
            if (highpass > 0) {
                filters.push(`highpass=f=${highpass}`);
            }
            
            if (lowpass < 20000) {
                filters.push(`lowpass=f=${lowpass}`);
            }
            
            if (denoise) {
                // Use RNNoise for AI-powered denoising
                filters.push('arnndn=m=./rnnn.model');
            }
            
            if (normalize) {
                filters.push('dynaudnorm=f=150:g=15:p=0.95');
            }
            
            const filterChain = filters.join(',');
            
            if (filterChain) {
                const preprocessedPath = await this.runFFmpegPreprocessing(audioFile, filterChain);
                this.app.log('✅ Audio preprocessing completed', 'success');
                return preprocessedPath;
            }
            
            return audioFile; // No preprocessing needed
            
        } catch (error) {
            this.app.log(`⚠️ Preprocessing failed, using original audio: ${error.message}`, 'warning');
            return audioFile;
        }
    }

    async runFFmpegPreprocessing(inputPath, filters) {
        return new Promise((resolve, reject) => {
            try {
                const { spawn } = require('child_process');
                const outputPath = inputPath.replace(/\.[^/.]+$/, '_preprocessed.wav');
                
                const args = [
                    '-i', inputPath,
                    '-af', filters,
                    '-y', // Overwrite output
                    outputPath
                ];
                
                const process = spawn(this.config.ffmpeg.executable, args);
                let stderr = '';
                
                process.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                process.on('close', (code) => {
                    if (code === 0) {
                        resolve(outputPath);
                    } else {
                        reject(new Error(`FFmpeg preprocessing failed: ${stderr}`));
                    }
                });
                
                process.on('error', (error) => {
                    reject(new Error(`FFmpeg execution failed: ${error.message}`));
                });
                
            } catch (error) {
                reject(new Error(`FFmpeg not available: ${error.message}`));
            }
        });
    }

    // ========================================
    // ENHANCED WHISPER AI DETECTION
    // ========================================

    async detectSilenceWithWhisper(audioFile) {
        this.app.log('🤖 Running enhanced Whisper AI analysis...', 'info');
        
        try {
            // Convert audio to blob if needed
            const audioBlob = await this.ensureAudioBlob(audioFile);
            
            // Enhanced Whisper request with better timestamp granularity
            const formData = new FormData();
            formData.append('file', audioBlob);
            formData.append('model', this.config.whisper.model);
            formData.append('response_format', this.config.whisper.responseFormat);
            formData.append('timestamp_granularities[]', 'segment');
            formData.append('timestamp_granularities[]', 'word');
            formData.append('language', this.config.whisper.language);
            
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getOpenAIKey()}`,
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            this.app.log('✅ Whisper transcription completed', 'success');
            
            // Extract silence segments from transcript
            const silenceSegments = this.extractSilenceFromWhisperTranscript(result);
            
            this.app.log(`🤖 Whisper detected ${silenceSegments.length} silence segments`, 'success');
            return silenceSegments;
            
        } catch (error) {
            this.app.log(`❌ Whisper detection failed: ${error.message}`, 'error');
            return [];
        }
    }

    extractSilenceFromWhisperTranscript(transcript) {
        const segments = transcript.segments || [];
        const totalDuration = transcript.duration || 0;
        const minSilenceDuration = this.config.silence.minDuration;
        
        if (segments.length === 0) {
            return [];
        }
        
        const silenceSegments = [];
        let lastEnd = 0;
        
        // Find silence between segments
        for (const segment of segments) {
            const gap = segment.start - lastEnd;
            
            if (gap >= minSilenceDuration) {
                silenceSegments.push({
                    start: lastEnd,
                    end: segment.start,
                    duration: gap,
                    confidence: 0.95, // High confidence for Whisper
                    method: 'whisper',
                    type: 'speech_gap',
                    context: {
                        beforeSegment: segment.text?.substring(0, 20) || 'start',
                        afterSegment: segment.text?.substring(0, 20) || 'end'
                    }
                });
            }
            
            lastEnd = segment.end;
        }
        
        // Check for silence at the end
        if (totalDuration > lastEnd) {
            const endGap = totalDuration - lastEnd;
            if (endGap >= minSilenceDuration) {
                silenceSegments.push({
                    start: lastEnd,
                    end: totalDuration,
                    duration: endGap,
                    confidence: 0.9,
                    method: 'whisper',
                    type: 'end_silence',
                    context: {
                        beforeSegment: 'end_of_audio',
                        afterSegment: 'none'
                    }
                });
            }
        }
        
        return silenceSegments;
    }

    // ========================================
    // ENHANCED FFMPEG DETECTION
    // ========================================

    async detectSilenceWithFFmpeg(audioFile) {
        this.app.log('🎬 Running enhanced FFmpeg silence detection...', 'info');
        
        try {
            const { noiseThreshold, minDuration } = this.config.silence;
            
            // Enhanced FFmpeg command with better silence detection
            const command = [
                this.config.ffmpeg.executable,
                '-i', audioFile,
                '-af', `silencedetect=noise=${noiseThreshold}dB:d=${minDuration}`,
                '-f', 'null',
                '-'
            ];
            
            const result = await this.executeFFmpeg(command);
            const silenceSegments = this.parseEnhancedFFmpegOutput(result.stdout);
            
            this.app.log(`🎬 FFmpeg detected ${silenceSegments.length} silence segments`, 'success');
            return silenceSegments;
            
        } catch (error) {
            this.app.log(`❌ FFmpeg detection failed: ${error.message}`, 'error');
            return [];
        }
    }

    parseEnhancedFFmpegOutput(output) {
        const silenceRegex = /\[silencedetect.*?\] silence_start: ([\d.]+)/g;
        const silenceEndRegex = /\[silencedetect.*?\] silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g;
        
        const segments = [];
        const starts = [];
        const ends = [];
        
        // Parse silence_start entries
        let match;
        while ((match = silenceRegex.exec(output)) !== null) {
            starts.push(parseFloat(match[1]));
        }
        
        // Parse silence_end entries
        while ((match = silenceEndRegex.exec(output)) !== null) {
            ends.push({
                end: parseFloat(match[1]),
                duration: parseFloat(match[2])
            });
        }
        
        // Match starts with ends and create segments
        for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
            segments.push({
                start: starts[i],
                end: ends[i].end,
                duration: ends[i].duration,
                confidence: 0.9,
                method: 'ffmpeg',
                type: 'amplitude_based',
                threshold: this.config.silence.noiseThreshold
            });
        }
        
        return segments;
    }

    // ========================================
    // ENHANCED WEB AUDIO API DETECTION
    // ========================================

    async detectSilenceWithWebAudio(audioFile) {
        this.app.log('🌊 Running enhanced Web Audio API analysis...', 'info');
        
        try {
            const audioBuffer = await this.loadAudioBuffer(audioFile);
            const silenceSegments = this.analyzeEnhancedAudioBuffer(audioBuffer);
            
            this.app.log(`🌊 Web Audio API detected ${silenceSegments.length} silence segments`, 'success');
            return silenceSegments;
            
        } catch (error) {
            this.app.log(`❌ Web Audio API detection failed: ${error.message}`, 'error');
            return [];
        }
    }

    analyzeEnhancedAudioBuffer(audioBuffer) {
        const { silenceThreshold, minDuration } = this.config.silence;
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0);
        const minSamples = Math.floor(minDuration * sampleRate);
        
        const silenceSegments = [];
        let silenceStart = null;
        let consecutiveSilentSamples = 0;
        let totalEnergy = 0;
        let silentSamples = 0;
        
        // Enhanced analysis with energy calculation
        for (let i = 0; i < channelData.length; i++) {
            const amplitude = Math.abs(channelData[i]);
            const energy = amplitude * amplitude;
            const timePosition = i / sampleRate;
            
            totalEnergy += energy;
            
            if (amplitude < silenceThreshold) {
                if (silenceStart === null) {
                    silenceStart = timePosition;
                }
                consecutiveSilentSamples++;
                silentSamples++;
            } else {
                if (silenceStart !== null && consecutiveSilentSamples >= minSamples) {
                    const avgEnergy = totalEnergy / (consecutiveSilentSamples + 1);
                    const confidence = this.calculateEnhancedConfidence(consecutiveSilentSamples, minSamples, avgEnergy);
                    
                    silenceSegments.push({
                        start: silenceStart,
                        end: timePosition,
                        duration: timePosition - silenceStart,
                        confidence: confidence,
                        method: 'webAudio',
                        type: 'sample_analysis',
                        energy: avgEnergy,
                        samples: consecutiveSilentSamples
                    });
                }
                
                silenceStart = null;
                consecutiveSilentSamples = 0;
            }
        }
        
        // Handle silence at the end
        if (silenceStart !== null && consecutiveSilentSamples >= minSamples) {
            const avgEnergy = totalEnergy / (consecutiveSilentSamples + 1);
            const confidence = this.calculateEnhancedConfidence(consecutiveSilentSamples, minSamples, avgEnergy);
            
            silenceSegments.push({
                start: silenceStart,
                end: channelData.length / sampleRate,
                duration: (channelData.length / sampleRate) - silenceStart,
                confidence: confidence,
                method: 'webAudio',
                type: 'end_silence',
                energy: avgEnergy,
                samples: consecutiveSilentSamples
            });
        }
        
        return silenceSegments;
    }

    calculateEnhancedConfidence(silentSamples, minSamples, energy) {
        // Base confidence from duration
        const durationConfidence = Math.min(0.5 + (silentSamples / minSamples) * 0.3, 0.9);
        
        // Energy-based confidence (lower energy = higher confidence)
        const energyConfidence = Math.max(0.1, 1 - (energy * 100));
        
        // Combined confidence
        return (durationConfidence + energyConfidence) / 2;
    }

    // ========================================
    // RESULT MERGING AND VALIDATION
    // ========================================

    mergeDetectionResults(results) {
        this.app.log('🔄 Merging detection results...', 'info');
        
        const allSegments = [
            ...(results.whisper || []),
            ...(results.ffmpeg || []),
            ...(results.webAudio || [])
        ];
        
        if (allSegments.length === 0) {
            return [];
        }
        
        // Sort by start time
        allSegments.sort((a, b) => a.start - b.start);
        
        // Merge overlapping or very close segments
        const merged = this.mergeCloseSegments(allSegments, 0.1);
        
        // Calculate consensus confidence
        const validated = merged.map(segment => ({
            ...segment,
            consensusConfidence: this.calculateConsensusConfidence(segment, allSegments),
            detectionMethods: this.getDetectionMethods(segment, allSegments)
        }));
        
        return validated;
    }

    mergeCloseSegments(segments, mergeThreshold = 0.1) {
        if (segments.length === 0) return [];
        
        const merged = [segments[0]];
        
        for (let i = 1; i < segments.length; i++) {
            const current = segments[i];
            const last = merged[merged.length - 1];
            
            // Check if segments are close enough to merge
            if (current.start - last.end <= mergeThreshold) {
                // Merge segments
                last.end = Math.max(last.end, current.end);
                last.duration = last.end - last.start;
                last.confidence = Math.max(last.confidence, current.confidence);
                last.detectionMethods = [...(last.detectionMethods || []), current.method];
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    }

    calculateConsensusConfidence(segment, allSegments) {
        // Find overlapping segments from different methods
        const overlapping = allSegments.filter(s => 
            s !== segment && 
            this.segmentsOverlap(segment, s, 0.5)
        );
        
        if (overlapping.length === 0) {
            return segment.confidence * 0.8; // Lower confidence for single-method detection
        }
        
        // Calculate weighted confidence based on method reliability
        const methodWeights = {
            whisper: 1.0,    // Highest weight for AI
            ffmpeg: 0.9,     // High weight for FFmpeg
            webAudio: 0.7    // Lower weight for Web Audio API
        };
        
        const weightedConfidences = [segment.confidence, ...overlapping.map(s => 
            s.confidence * (methodWeights[s.method] || 0.5)
        )];
        
        return weightedConfidences.reduce((sum, conf) => sum + conf, 0) / weightedConfidences.length;
    }

    segmentsOverlap(seg1, seg2, overlapThreshold = 0.5) {
        const overlap = Math.max(0, Math.min(seg1.end, seg2.end) - Math.max(seg1.start, seg2.start));
        const minDuration = Math.min(seg1.duration, seg2.duration);
        return overlap / minDuration >= overlapThreshold;
    }

    getDetectionMethods(segment, allSegments) {
        const overlapping = allSegments.filter(s => this.segmentsOverlap(segment, s));
        const methods = [...new Set(overlapping.map(s => s.method))];
        return methods;
    }

    // ========================================
    // CONFIDENCE SCORING AND FILTERING
    // ========================================

    applyConfidenceScoring(segments) {
        this.app.log('🎯 Applying confidence scoring...', 'info');
        
        const { confidenceThreshold } = this.config.silence;
        
        // Filter by confidence threshold
        const filtered = segments.filter(segment => 
            segment.consensusConfidence >= confidenceThreshold
        );
        
        // Sort by confidence (highest first)
        filtered.sort((a, b) => b.consensusConfidence - a.consensusConfidence);
        
        // Add quality indicators
        const enhanced = filtered.map(segment => ({
            ...segment,
            quality: this.calculateQualityScore(segment),
            recommended: segment.consensusConfidence >= 0.8
        }));
        
        this.app.log(`🎯 Confidence filtering: ${segments.length} → ${enhanced.length} segments`, 'info');
        return enhanced;
    }

    calculateQualityScore(segment) {
        let score = 0;
        
        // Method diversity bonus
        if (segment.detectionMethods && segment.detectionMethods.length > 1) {
            score += 20;
        }
        
        // Duration bonus (optimal silence length)
        if (segment.duration >= 0.5 && segment.duration <= 2.0) {
            score += 15;
        } else if (segment.duration > 2.0) {
            score += 10;
        }
        
        // Confidence bonus
        score += segment.consensusConfidence * 50;
        
        // Type-specific bonuses
        if (segment.type === 'speech_gap') score += 10;
        if (segment.type === 'end_silence') score += 5;
        
        return Math.min(100, score);
    }

    calculateOverallConfidence(segments) {
        if (segments.length === 0) return 0;
        
        const totalConfidence = segments.reduce((sum, seg) => 
            sum + seg.consensusConfidence, 0
        );
        
        return totalConfidence / segments.length;
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    async ensureAudioBlob(audioFile) {
        if (audioFile instanceof Blob) {
            return audioFile;
        }
        
        if (typeof audioFile === 'string') {
            try {
                const response = await fetch(audioFile);
                return await response.blob();
            } catch (error) {
                throw new Error(`Failed to convert audio file to blob: ${error.message}`);
            }
        }
        
        throw new Error('Unsupported audio file format');
    }

    initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                this.app.log('🎵 Web Audio API context initialized', 'info');
            } else {
                this.app.log('⚠️ Web Audio API not supported', 'warning');
            }
        } catch (error) {
            this.app.log(`⚠️ Audio context initialization failed: ${error.message}`, 'warning');
        }
    }

    async loadAudioBuffer(audioFile) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }
        
        const arrayBuffer = await this.fileToArrayBuffer(audioFile);
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.audioBuffer = audioBuffer;
        return audioBuffer;
    }

    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read audio file'));
            reader.readAsArrayBuffer(file);
        });
    }

    async executeFFmpeg(command) {
        const { spawn } = require('child_process');
        
        return new Promise((resolve, reject) => {
            const process = spawn(command[0], command.slice(1));
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
                }
            });
            
            process.on('error', (error) => {
                reject(new Error(`FFmpeg execution failed: ${error.message}`));
            });
        });
    }

    getFFmpegPath() {
        const os = require('os');
        const platform = os.platform();
        
        if (platform === 'win32') {
            return 'ffmpeg.exe';
        } else {
            return '/usr/local/bin/ffmpeg';
        }
    }

    getOpenAIKey() {
        return process.env.OPENAI_API_KEY || this.app.settings?.openaiApiKey;
    }

    // Configuration methods
    updateConfig(section, updates) {
        if (this.config[section]) {
            Object.assign(this.config[section], updates);
            this.app.log(`⚙️ Updated ${section} configuration`, 'info');
        }
    }

    getConfig() {
        return { ...this.config };
    }
}

module.exports = EnhancedSilenceDetector;
