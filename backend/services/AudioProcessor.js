const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

class AudioProcessor {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.chunkSize = 25 * 1024 * 1024; // 25MB chunks
        this.maxConcurrent = 5; // 5 concurrent chunks
        this.rateLimitDelay = 2000; // 2 seconds between batches
    }
    
    async processLargeFile(filePath, options = {}, progressCallback = null) {
        try {
            console.log(`🎵 Starting large file processing: ${filePath}`);
            
            // Get file info
            const fileStats = await fs.stat(filePath);
            const fileSize = fileStats.size;
            const totalChunks = Math.ceil(fileSize / this.chunkSize);
            
            console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
            console.log(`📊 Total chunks: ${totalChunks}`);
            
            if (progressCallback) {
                progressCallback(0, `Starting processing of ${totalChunks} chunks...`);
            }
            
            // Process chunks in parallel batches
            const results = [];
            let completedChunks = 0;
            
            for (let batchIndex = 0; batchIndex < Math.ceil(totalChunks / this.maxConcurrent); batchIndex++) {
                const batchStart = batchIndex * this.maxConcurrent;
                const batchEnd = Math.min(batchStart + this.maxConcurrent, totalChunks);
                const batchSize = batchEnd - batchStart;
                
                console.log(`🚀 Processing batch ${batchIndex + 1}/${Math.ceil(totalChunks / this.maxConcurrent)} (${batchSize} chunks)`);
                
                if (progressCallback) {
                    const progress = Math.round((completedChunks / totalChunks) * 100);
                    progressCallback(progress, `Processing batch ${batchIndex + 1}...`);
                }
                
                // Process batch in parallel
                const batchPromises = [];
                for (let i = batchStart; i < batchEnd; i++) {
                    batchPromises.push(this.processChunk(i, filePath, options));
                }
                
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Process results
                for (let i = 0; i < batchResults.length; i++) {
                    const result = batchResults[i];
                    const chunkIndex = batchStart + i;
                    
                    if (result.status === 'fulfilled' && result.value) {
                        results.push(result.value);
                        completedChunks++;
                        console.log(`✅ Chunk ${chunkIndex + 1} completed successfully`);
                    } else {
                        console.log(`❌ Chunk ${chunkIndex + 1} failed: ${result.reason?.message || 'Unknown error'}`);
                    }
                }
                
                // Rate limiting between batches
                if (batchIndex < Math.ceil(totalChunks / this.maxConcurrent) - 1) {
                    console.log('⏳ Rate limiting: waiting 2s before next batch...');
                    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
                }
            }
            
            if (results.length === 0) {
                throw new Error('No chunks were successfully processed');
            }
            
            // Merge results
            const mergedResults = this.mergeChunkResults(results);
            
            console.log(`✅ Processing completed: ${results.length} chunks processed successfully`);
            
            if (progressCallback) {
                progressCallback(100, 'Processing completed successfully!');
            }
            
            return mergedResults;
            
        } catch (error) {
            console.error('Audio processing failed:', error);
            throw error;
        }
    }
    
    async processChunk(chunkIndex, filePath, options) {
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Processing chunk ${chunkIndex + 1} (attempt ${attempt}/${maxRetries})`);
                
                // Calculate chunk boundaries
                const startByte = chunkIndex * this.chunkSize;
                const endByte = Math.min(startByte + this.chunkSize, (await fs.stat(filePath)).size);
                
                // Extract audio chunk using ffmpeg
                const chunkPath = await this.extractAudioChunk(filePath, startByte, endByte, chunkIndex);
                
                // Process with OpenAI Whisper
                const result = await this.processWithWhisper(chunkPath, chunkIndex);
                
                // Clean up temporary file
                await fs.remove(chunkPath);
                
                return result;
                
            } catch (error) {
                console.log(`❌ Chunk ${chunkIndex + 1} attempt ${attempt} failed: ${error.message}`);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    
    async extractAudioChunk(filePath, startByte, endByte, chunkIndex) {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(__dirname, '..', 'temp', `chunk_${chunkIndex}_${uuidv4()}.wav`);
            
            // Ensure temp directory exists
            fs.ensureDirSync(path.dirname(outputPath));
            
            // Calculate time offset based on byte position
            const timeOffset = startByte / (25 * 1024 * 1024) * 30; // Rough estimate
            
            ffmpeg(filePath)
                .seekInput(timeOffset)
                .duration(30) // 30 seconds per chunk
                .audioChannels(1)
                .audioFrequency(16000)
                .format('wav')
                .output(outputPath)
                .on('end', () => {
                    console.log(`✅ Audio chunk extracted: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error(`❌ FFmpeg error for chunk ${chunkIndex}:`, err);
                    reject(err);
                })
                .run();
        });
    }
    
    async processWithWhisper(chunkPath, chunkIndex) {
        try {
            console.log(`🤖 Processing chunk ${chunkIndex + 1} with OpenAI Whisper...`);
            
            const audioFile = fs.createReadStream(chunkPath);
            
            const response = await this.openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                response_format: 'verbose_json',
                timestamp_granularities: ['word', 'segment']
            });
            
            // Adjust timestamps based on chunk index
            const chunkStartTime = chunkIndex * 30; // 30 seconds per chunk
            
            const adjustedWords = response.words?.map(word => ({
                ...word,
                start: word.start + chunkStartTime,
                end: word.end + chunkStartTime
            })) || [];
            
            const adjustedSegments = response.segments?.map(segment => ({
                ...segment,
                start: segment.start + chunkStartTime,
                end: segment.end + chunkStartTime
            })) || [];
            
            return {
                chunkIndex: chunkIndex,
                words: adjustedWords,
                segments: adjustedSegments,
                text: response.text,
                language: response.language,
                duration: response.duration
            };
            
        } catch (error) {
            console.error(`❌ Whisper API error for chunk ${chunkIndex + 1}:`, error);
            throw error;
        }
    }
    
    mergeChunkResults(results) {
        console.log('🔄 Merging chunk results...');
        
        // Sort results by chunk index
        results.sort((a, b) => a.chunkIndex - b.chunkIndex);
        
        // Merge all words and segments
        const allWords = [];
        const allSegments = [];
        let totalDuration = 0;
        
        for (const result of results) {
            allWords.push(...result.words);
            allSegments.push(...result.segments);
            totalDuration = Math.max(totalDuration, result.duration + (result.chunkIndex * 30));
        }
        
        // Sort by timestamp
        allWords.sort((a, b) => a.start - b.start);
        allSegments.sort((a, b) => a.start - b.start);
        
        // Detect silence segments
        const silenceSegments = this.detectSilenceSegments(allWords, allSegments, totalDuration);
        
        return {
            words: allWords,
            segments: allSegments,
            silenceSegments: silenceSegments,
            totalDuration: totalDuration,
            totalChunks: results.length,
            successRate: (results.length / results.length) * 100
        };
    }
    
    detectSilenceSegments(words, segments, totalDuration) {
        const silenceThreshold = 2.0; // 2 seconds of silence
        const silenceSegments = [];
        
        let currentSilenceStart = 0;
        let inSilence = false;
        
        // Check for silence at the beginning
        if (words.length > 0 && words[0].start > silenceThreshold) {
            silenceSegments.push({
                start: 0,
                end: words[0].start,
                duration: words[0].start,
                type: 'silence'
            });
        }
        
        // Check for silence between words
        for (let i = 0; i < words.length - 1; i++) {
            const currentWord = words[i];
            const nextWord = words[i + 1];
            const gap = nextWord.start - currentWord.end;
            
            if (gap > silenceThreshold) {
                silenceSegments.push({
                    start: currentWord.end,
                    end: nextWord.start,
                    duration: gap,
                    type: 'silence'
                });
            }
        }
        
        // Check for silence at the end
        if (words.length > 0) {
            const lastWord = words[words.length - 1];
            if (totalDuration - lastWord.end > silenceThreshold) {
                silenceSegments.push({
                    start: lastWord.end,
                    end: totalDuration,
                    duration: totalDuration - lastWord.end,
                    type: 'silence'
                });
            }
        }
        
        return silenceSegments;
    }
}

module.exports = AudioProcessor;

