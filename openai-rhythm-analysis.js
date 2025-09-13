// ========================================
// OPENAI INTEGRATION FOR RHYTHM ANALYSIS
// ========================================

// Perform OpenAI GPT Analysis on Rhythm Patterns
AudioToolsPro.prototype.performOpenAIRhythmAnalysis = async function(analysisResults, existingCorrections) {
    if (!this.openaiConfig.enabled || !this.openaiConfig.apiKey) {
        throw new Error('OpenAI API not configured');
    }

    try {
        this.log('🤖 Starting OpenAI GPT-4 analysis of timing patterns...', 'info');
        
        // Prepare analysis data for GPT
        const audioSummary = {
            duration: analysisResults.duration,
            totalSpeechTime: analysisResults.totalSpeechTime,
            totalSilenceTime: analysisResults.totalSilenceTime,
            speakingRate: analysisResults.speakingRate,
            rhythmConsistency: analysisResults.rhythmConsistency,
            speechSegments: analysisResults.speechRegions?.length || 0,
            silenceSegments: analysisResults.silenceRegions?.length || 0,
            averagePauseDuration: analysisResults.averagePause,
            longPauses: analysisResults.longPauses?.length || 0,
            shortSpeechSegments: analysisResults.shortSpeech?.length || 0,
            detectedIssues: analysisResults.detectedIssues
        };

        // Create detailed timing pattern analysis
        const timingPatterns = this.createTimingPatternsForGPT(analysisResults);
        
        const prompt = `You are an expert audio editor analyzing speech timing patterns for a ${this.rhythmTimingConfig.enableFlowAnalysis ? 'podcast/interview conversation' : 'speech recording'}. 

AUDIO ANALYSIS DATA:
- Duration: ${audioSummary.duration.toFixed(1)}s
- Speaking Rate: ${audioSummary.speakingRate.toFixed(0)} WPM
- Speech Time: ${audioSummary.totalSpeechTime.toFixed(1)}s (${((audioSummary.totalSpeechTime/audioSummary.duration)*100).toFixed(0)}%)
- Silence Time: ${audioSummary.totalSilenceTime.toFixed(1)}s (${((audioSummary.totalSilenceTime/audioSummary.duration)*100).toFixed(0)}%)
- Rhythm Consistency: ${(audioSummary.rhythmConsistency*100).toFixed(0)}%
- Long Pauses (>2s): ${audioSummary.longPauses}
- Very Short Segments (<0.5s): ${audioSummary.shortSpeechSegments}

TIMING PATTERNS:
${timingPatterns}

EXISTING DETECTED ISSUES:
${existingCorrections.map(c => `- ${c.type}: ${c.name} at ${c.timestamp.toFixed(1)}s (${c.severity})`).join('\n')}

Please analyze this audio timing data and provide specific, actionable recommendations for improving conversational flow and timing. Focus on:

1. **Optimal Cut Points**: Identify the best places to trim or adjust timing
2. **Conversational Flow**: Assess naturalness and suggest improvements
3. **Engagement Optimization**: Recommend timing changes to maintain listener attention
4. **Professional Polish**: Suggest edits that make the audio sound more professional

Respond with a JSON object containing enhanced corrections in this format:
{
  "analysis": {
    "overallAssessment": "brief assessment of timing quality",
    "primaryIssues": ["issue1", "issue2"],
    "flowRating": 0.8,
    "recommendations": "key recommendations"
  },
  "corrections": [
    {
      "type": "correction_type",
      "name": "Human-readable name",
      "timestamp": 12.5,
      "currentDuration": 3.2,
      "suggestedDuration": 1.8,
      "severity": "high",
      "action": "trim_pause",
      "reasoning": "why this correction improves the audio",
      "impact": "expected improvement",
      "priority": 8,
      "gptSuggestion": "detailed explanation"
    }
  ]
}`;

        // Make API call to OpenAI
        const response = await fetch(`${this.openaiConfig.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.openaiConfig.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert audio editor and timing specialist. Provide detailed, professional audio editing recommendations in valid JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.openaiConfig.maxTokens,
                temperature: this.openaiConfig.temperature,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const gptResponse = JSON.parse(data.choices[0].message.content);
        
        this.log(`🤖 GPT Analysis: ${gptResponse.analysis.overallAssessment}`, 'info');
        this.log(`🎯 Flow Rating: ${(gptResponse.analysis.flowRating * 100).toFixed(0)}%`, 'info');
        
        // Merge GPT corrections with existing ones, prioritizing GPT insights
        const enhancedCorrections = this.mergeGPTCorrections(existingCorrections, gptResponse.corrections);
        
        // Store GPT analysis results
        this.rhythmTimingConfig.gptAnalysis = gptResponse.analysis;
        
        return enhancedCorrections;

    } catch (error) {
        this.log(`❌ OpenAI analysis error: ${error.message}`, 'error');
        throw error;
    }
};

// Create timing patterns summary for GPT analysis
AudioToolsPro.prototype.createTimingPatternsForGPT = function(analysisResults) {
    let patterns = '';
    
    // Analyze speech patterns
    if (analysisResults.speechRegions && analysisResults.speechRegions.length > 0) {
        const speechDurations = analysisResults.speechRegions.map(r => r.duration);
        const avgSpeech = speechDurations.reduce((a, b) => a + b, 0) / speechDurations.length;
        patterns += `Speech Segments: ${speechDurations.length} segments, avg ${avgSpeech.toFixed(1)}s\n`;
        
        // Show problematic segments
        const longSpeech = analysisResults.speechRegions.filter(r => r.duration > 15);
        const shortSpeech = analysisResults.speechRegions.filter(r => r.duration < 0.5);
        
        if (longSpeech.length > 0) {
            patterns += `Long Speech (>15s): ${longSpeech.map(s => `${s.start.toFixed(1)}-${s.end.toFixed(1)}s`).join(', ')}\n`;
        }
        if (shortSpeech.length > 0) {
            patterns += `Short Speech (<0.5s): ${shortSpeech.map(s => `${s.start.toFixed(1)}s`).join(', ')}\n`;
        }
    }
    
    // Analyze pause patterns
    if (analysisResults.silenceRegions && analysisResults.silenceRegions.length > 0) {
        const pauseDurations = analysisResults.silenceRegions.map(r => r.duration);
        const avgPause = pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length;
        patterns += `Pause Segments: ${pauseDurations.length} pauses, avg ${avgPause.toFixed(1)}s\n`;
        
        // Show problematic pauses
        const longPauses = analysisResults.silenceRegions.filter(r => r.duration > 2.0);
        const awkwardPauses = analysisResults.silenceRegions.filter(r => r.duration > 0.3 && r.duration < 0.8);
        
        if (longPauses.length > 0) {
            patterns += `Long Pauses (>2s): ${longPauses.map(p => `${p.start.toFixed(1)}s (${p.duration.toFixed(1)}s)`).join(', ')}\n`;
        }
        if (awkwardPauses.length > 0) {
            patterns += `Awkward Pauses (0.3-0.8s): ${awkwardPauses.map(p => `${p.start.toFixed(1)}s`).join(', ')}\n`;
        }
    }
    
    return patterns || 'No significant timing patterns detected';
};

// Merge GPT corrections with existing local analysis
AudioToolsPro.prototype.mergeGPTCorrections = function(existingCorrections, gptCorrections) {
    const merged = [...existingCorrections];
    let correctionId = existingCorrections.length;
    
    // Add GPT corrections, avoiding duplicates
    for (const gptCorrection of gptCorrections) {
        // Check if similar correction already exists
        const isDuplicate = existingCorrections.some(existing => 
            Math.abs(existing.timestamp - gptCorrection.timestamp) < 0.5 &&
            existing.type === gptCorrection.type
        );
        
        if (!isDuplicate) {
            merged.push({
                id: correctionId++,
                ...gptCorrection,
                source: 'gpt-analysis',
                apply: gptCorrection.priority >= 7, // Auto-enable high priority corrections
                timingSavings: Math.max(0, (gptCorrection.currentDuration || 0) - (gptCorrection.suggestedDuration || 0))
            });
        } else {
            // Enhance existing correction with GPT insights
            const existingIndex = existingCorrections.findIndex(existing => 
                Math.abs(existing.timestamp - gptCorrection.timestamp) < 0.5 &&
                existing.type === gptCorrection.type
            );
            
            if (existingIndex >= 0) {
                merged[existingIndex].gptSuggestion = gptCorrection.gptSuggestion;
                merged[existingIndex].reasoning = gptCorrection.reasoning;
                merged[existingIndex].impact = gptCorrection.impact;
                merged[existingIndex].priority = gptCorrection.priority;
            }
        }
    }
    
    // Sort by priority (GPT-enhanced) and timestamp
    return merged.sort((a, b) => {
        const priorityDiff = (b.priority || 5) - (a.priority || 5);
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });
};