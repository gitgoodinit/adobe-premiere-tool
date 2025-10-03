/**
 * OpenAI Whisper Integration Service
 * Handles AI-powered audio transcription and silence detection
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const Logger = require('./Logger');

class OpenAIService {
    constructor() {
        this.logger = new Logger();
        this.apiKey = process.env.OPENAI_API_KEY || null;
        this.baseURL = 'https://api.openai.com/v1';
        this.maxFileSize = 25 * 1024 * 1024; // 25MB OpenAI limit
        this.chunkDuration = 60; // 60 seconds per chunk
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.logger.info('OpenAI API key configured');
    }

    async testConnection() {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            this.logger.info('Testing OpenAI API connection...');
            
            const response = await fetch(`${this.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.logger.info('OpenAI API connection successful');
                return true;
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
                throw new Error(`OpenAI API error: ${errorMessage}`);
            }
        } catch (error) {
            this.logger.error('OpenAI connection test failed:', error);
            throw error;
        }
    }

    async transcribeAudio(filePath, options = {}) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            this.logger.info('Starting OpenAI Whisper transcription', { filePath, options });
            
            // Check file size
            const stats = fs.statSync(filePath);
            this.logger.info(`Audio file size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

            if (stats.size > this.maxFileSize) {
                throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: 25MB)`);
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'verbose_json');
            
            if (options.language) {
                formData.append('language', options.language);
            }

            if (options.timestamp_granularities) {
                options.timestamp_granularities.forEach(granularity => {
                    formData.append('timestamp_granularities[]', granularity);
                });
            }

            this.logger.info('Sending request to OpenAI Whisper API...');
            
            const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    ...formData.getHeaders()
                },
                body: formData
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (parseError) {
                    // Use status if can't parse error
                }
                
                this.logger.error(`OpenAI API error ${response.status}: ${errorMessage}`);
                throw new Error(`OpenAI API error ${response.status}: ${errorMessage}`);
            }

            const result = await response.json();
            this.logger.info('OpenAI Whisper transcription completed successfully');
            
            return result;

        } catch (error) {
            this.logger.error('OpenAI transcription failed:', error);
            throw error;
        }
    }

    async detectSilenceFromTranscript(filePath, options = {}) {
        try {
            this.logger.info('Starting AI-powered silence detection', { filePath, options });
            
            // Get transcript with word-level timestamps
            const transcript = await this.transcribeAudio(filePath, {
                response_format: 'verbose_json',
                timestamp_granularities: ['word'],
                language: options.language
            });

            if (!transcript) {
                throw new Error('No transcript received from OpenAI');
            }

            this.logger.info('Transcript received, analyzing for silence...');
            
            // Extract silence segments from transcript
            const silenceSegments = this.analyzeSilenceFromWords(
                transcript.words || [],
                options.threshold || -30,
                options.minDuration || 0.5
            );

            this.logger.info(`AI silence detection completed: ${silenceSegments.length} segments found`);
            
            return {
                silenceSegments,
                transcript: transcript.text,
                duration: transcript.duration,
                confidence: 0.95,
                method: 'ai_transcript'
            };

        } catch (error) {
            this.logger.error('AI silence detection failed:', error);
            throw error;
        }
    }

    analyzeSilenceFromWords(words, threshold, minSilence) {
        const silenceResults = [];
        const minSilenceSeconds = minSilence;
        
        if (!words || words.length === 0) {
            this.logger.warn('No words found in transcript for silence analysis');
            return silenceResults;
        }

        // Sort words by start time
        const sortedWords = words.sort((a, b) => a.start - b.start);
        this.logger.info(`Analyzing ${sortedWords.length} words for silence gaps`);

        // Analyze gaps between words
        for (let i = 0; i < sortedWords.length - 1; i++) {
            const currentWord = sortedWords[i];
            const nextWord = sortedWords[i + 1];
            
            // Calculate gap between words
            const gapStart = currentWord.end || 0;
            const gapEnd = nextWord.start || 0;
            const gapDuration = gapEnd - gapStart;
            
            // Check if gap is long enough to be considered silence
            if (gapDuration >= minSilenceSeconds) {
                const silenceSegment = {
                    start: gapStart,
                    end: gapEnd,
                    duration: gapDuration,
                    method: 'transcript',
                    confidence: 0.95,
                    wordBefore: currentWord.word || currentWord.text,
                    wordAfter: nextWord.word || nextWord.text
                };
                
                silenceResults.push(silenceSegment);
            }
        }

        // Check for silence at the beginning
        if (sortedWords.length > 0) {
            const firstWord = sortedWords[0];
            if (firstWord.start > minSilenceSeconds) {
                silenceResults.unshift({
                    start: 0,
                    end: firstWord.start,
                    duration: firstWord.start,
                    method: 'transcript',
                    confidence: 0.95,
                    wordBefore: null,
                    wordAfter: firstWord.word || firstWord.text
                });
            }

            // Check for silence at the end (estimate based on last word + buffer)
            const lastWord = sortedWords[sortedWords.length - 1];
            const estimatedEndTime = lastWord.end + 2; // Add 2 second buffer
            
            // Only add end silence if there's a significant gap
            if (estimatedEndTime - lastWord.end > minSilenceSeconds) {
                silenceResults.push({
                    start: lastWord.end,
                    end: estimatedEndTime,
                    duration: estimatedEndTime - lastWord.end,
                    method: 'transcript',
                    confidence: 0.8, // Lower confidence for estimated end
                    wordBefore: lastWord.word || lastWord.text,
                    wordAfter: null
                });
            }
        }

        this.logger.info(`Found ${silenceResults.length} silence segments from transcript analysis`);
        return silenceResults;
    }

    // Create basic word timing from text-only response (fallback)
    createBasicWordTiming(text, duration) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const wordDuration = duration / words.length;
        
        return words.map((word, index) => ({
            word: word,
            start: index * wordDuration,
            end: (index + 1) * wordDuration
        }));
    }
}

module.exports = OpenAIService;