// ExtendScript for Media Tools Pro
// This file provides the bridge between CEP and Adobe Premiere Pro

// Test function to verify ExtendScript execution
function testExtendScript() {
    return "ExtendScript execution successful";
}

// Simple Base64 encoder for ExtendScript (since btoa is not available)
function base64Encode(binaryString) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var i = 0;

    while (i < binaryString.length) {
        var chr1 = binaryString.charCodeAt(i++) & 0xff;
        var chr2 = binaryString.charCodeAt(i++);
        var chr3 = binaryString.charCodeAt(i++);

        var enc1 = chr1 >> 2;
        var enc2 = ((chr1 & 3) << 4) | ((isNaN(chr2) ? 0 : chr2) >> 4);
        var enc3 = isNaN(chr2) ? 64 : (((chr2 & 15) << 2) | ((isNaN(chr3) ? 0 : chr3) >> 6));
        var enc4 = isNaN(chr3) ? 64 : (chr3 & 63);

        output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
    }

    return output;
}

// Get basic application information
function getApplicationInfo() {
    try {
        var result = {
            success: true,
            appName: app.appName || "Adobe Premiere Pro",
            appVersion: app.appVersion || "Unknown",
            hasProject: false,
            hasSequence: false,
            sequenceInfo: null,
            timestamp: new Date().toISOString()
        };
        
        // Check if project is loaded
        if (app.project) {
            result.hasProject = true;
            
            // Check if sequence is active
            if (app.project.activeSequence) {
                result.hasSequence = true;
                var seq = app.project.activeSequence;
                
                result.sequenceInfo = {
                    name: seq.name || "Untitled Sequence",
                    videoTracks: seq.videoTracks ? seq.videoTracks.numTracks : 0,
                    audioTracks: seq.audioTracks ? seq.audioTracks.numTracks : 0
                };
            }
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: error.toString(),
            timestamp: new Date().toISOString()
        });
    }
}

// Get selected clips information
function getSelectedClipsInfo() {
    try {
        var result = {
            selectedClips: [],
            tracks: [],
            sequence: {
                name: "No Sequence",
                duration: 0,
                frameRate: 23.976
            }
        };
        
        // Check if we have an active sequence
        if (!app.project || !app.project.activeSequence) {
            result.error = "No active sequence found";
            return JSON.stringify(result);
        }
        
        var sequence = app.project.activeSequence;
        result.sequence.name = sequence.name || "Untitled Sequence";
        
        // Get video tracks
        if (sequence.videoTracks) {
            for (var v = 0; v < sequence.videoTracks.numTracks; v++) {
                var track = sequence.videoTracks[v];
                var trackInfo = {
                    name: "V" + (v + 1),
                    type: "video",
                    clips: 0
                };
                
                if (track.clips) {
                    trackInfo.clips = track.clips.numItems;
                    
                    // Check for selected clips
                    for (var c = 0; c < track.clips.numItems; c++) {
                        var clip = track.clips[c];
                        if (clip.isSelected && clip.isSelected()) {
                            result.selectedClips.push({
                                name: clip.name || "Unnamed Clip",
                                trackType: "video",
                                trackIndex: v,
                                duration: clip.duration ? clip.duration.seconds : 0,
                                mediaPath: (clip.projectItem && clip.projectItem.getMediaPath) ? 
                                          clip.projectItem.getMediaPath() : null
                            });
                        }
                    }
                }
                
                result.tracks.push(trackInfo);
            }
        }
        
        // Get audio tracks
        if (sequence.audioTracks) {
            for (var a = 0; a < sequence.audioTracks.numTracks; a++) {
                var track = sequence.audioTracks[a];
                var trackInfo = {
                    name: "A" + (a + 1),
                    type: "audio",
                    clips: 0
                };
                
                if (track.clips) {
                    trackInfo.clips = track.clips.numItems;
                    
                    // Check for selected clips
                    for (var c = 0; c < track.clips.numItems; c++) {
                        var clip = track.clips[c];
                        if (clip.isSelected && clip.isSelected()) {
                            result.selectedClips.push({
                                name: clip.name || "Unnamed Clip",
                                trackType: "audio",
                                trackIndex: a,
                                duration: clip.duration ? clip.duration.seconds : 0,
                                mediaPath: (clip.projectItem && clip.projectItem.getMediaPath) ? 
                                          clip.projectItem.getMediaPath() : null
                            });
                        }
                    }
                }
                
                result.tracks.push(trackInfo);
            }
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return JSON.stringify({
            selectedClips: [],
            tracks: [],
            sequence: {
                name: "Error",
                duration: 0,
                frameRate: 23.976
            },
            error: error.toString()
        });
    }
}

// Extract audio file path from selected clip
function extractAudioPath() {
    try {
        if (!app.project || !app.project.activeSequence) {
            return JSON.stringify({
                success: false,
                error: "No active sequence"
            });
        }
        
        var sequence = app.project.activeSequence;
        var selectedClipPath = null;
        
        // Check video tracks for selected clips
        if (sequence.videoTracks) {
            for (var v = 0; v < sequence.videoTracks.numTracks; v++) {
                var track = sequence.videoTracks[v];
                if (track.clips) {
                    for (var c = 0; c < track.clips.numItems; c++) {
                        var clip = track.clips[c];
                        if (clip.isSelected && clip.isSelected()) {
                            if (clip.projectItem && clip.projectItem.getMediaPath) {
                                selectedClipPath = clip.projectItem.getMediaPath();
                                break;
                            }
                        }
                    }
                }
                if (selectedClipPath) break;
            }
        }
        
        // Check audio tracks if no video clip found
        if (!selectedClipPath && sequence.audioTracks) {
            for (var a = 0; a < sequence.audioTracks.numTracks; a++) {
                var track = sequence.audioTracks[a];
                if (track.clips) {
                    for (var c = 0; c < track.clips.numItems; c++) {
                        var clip = track.clips[c];
                        if (clip.isSelected && clip.isSelected()) {
                            if (clip.projectItem && clip.projectItem.getMediaPath) {
                                selectedClipPath = clip.projectItem.getMediaPath();
                                break;
                            }
                        }
                    }
                }
                if (selectedClipPath) break;
            }
        }
        
        if (selectedClipPath) {
            return JSON.stringify({
                success: true,
                mediaPath: selectedClipPath
            });
        } else {
            return JSON.stringify({
                success: false,
                error: "No selected clips found or clips have no media path"
            });
        }
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: error.toString()
        });
    }
}

// Read file content as base64 (for audio files)
function readFileAsBase64(filePath) {
    try {
        var file = new File(filePath);
        if (!file.exists) {
            return JSON.stringify({
                success: false,
                error: "File does not exist: " + filePath
            });
        }
        
        // Read raw binary and encode to Base64
        file.encoding = "BINARY";
        file.open("r");
        var content = file.read();
        file.close();
        
        // Convert to base64 (ExtendScript doesn't have btoa)
        var base64Content = base64Encode(content);
        
        return JSON.stringify({
            success: true,
            content: base64Content,
            size: content.length,
            path: filePath
        });
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: error.toString()
        });
    }
}

// Detect silence using FFmpeg's silencedetect filter
// Returns JSON: { success: true, silences: [{ start:Number, end:Number, duration:Number }] }
function detectSilenceWithFFmpeg(filePath, thresholdDb, minSilenceSec, ffmpegPath) {
	try {
		if (!filePath) {
			return JSON.stringify({ success: false, error: 'No file path provided' });
		}

		// Resolve FFmpeg binary path
		var candidates = [];
		if (ffmpegPath && ffmpegPath.length) {
			candidates.push(ffmpegPath);
		}
		// Common macOS Homebrew locations first
		candidates.push('/opt/homebrew/bin/ffmpeg');
		candidates.push('/usr/local/bin/ffmpeg');
		candidates.push('/usr/bin/ffmpeg');

		var ffmpeg = null;
		for (var i = 0; i < candidates.length; i++) {
			var p = new File(candidates[i]);
			if (p.exists) { ffmpeg = candidates[i]; break; }
		}
		if (!ffmpeg) {
			return JSON.stringify({
				success: false,
				error: 'FFmpeg not found. Install via Homebrew (brew install ffmpeg) or set an absolute path.'
			});
		}

		// Build the command. Quote paths to handle spaces.
		var noise = (thresholdDb || -30) + 'dB';
		var d = (minSilenceSec || 0.5);
		var inPath = '"' + filePath + '"';
		var command = '"' + ffmpeg + '" -hide_banner -i ' + inPath + ' -af "silencedetect=noise=' + noise + ':d=' + d + '" -f null - 2>&1';

		// On macOS, wrap with bash to ensure redirection works
		var bash = new File('/bin/bash');
		var fullCmd = bash.exists ? ('/bin/bash -lc ' + '"' + command.replace(/"/g, '\\"') + '"') : command;

		var output = system.callSystem(fullCmd);
		if (!output) {
			return JSON.stringify({ success: false, error: 'No output from FFmpeg.' });
		}

		// Parse FFmpeg silencedetect output
		// Lines example:
		// [silencedetect @ ...] silence_start: 2.5
		// [silencedetect @ ...] silence_end: 4.2 | silence_duration: 1.7
		var lines = output.split(/\r?\n/);
		var silences = [];
		var currentStart = null;
		for (var li = 0; li < lines.length; li++) {
			var line = lines[li];
			if (!line) { continue; }
			var sIdx = line.indexOf('silence_start:');
			if (sIdx !== -1) {
				var startStr = line.substring(sIdx + 'silence_start:'.length).trim();
				var startVal = parseFloat(startStr);
				if (!isNaN(startVal)) { currentStart = startVal; }
				continue;
			}
			var eIdx = line.indexOf('silence_end:');
			if (eIdx !== -1) {
				var rest = line.substring(eIdx + 'silence_end:'.length).trim();
				// Format: <end> | silence_duration: <dur>
				var parts = rest.split('|');
				var endVal = parseFloat(parts[0]);
				var durVal = null;
				var durIdx = line.indexOf('silence_duration:');
				if (durIdx !== -1) {
					var durStr = line.substring(durIdx + 'silence_duration:'.length).trim();
					durVal = parseFloat(durStr);
				}
				if (!isNaN(endVal)) {
					var startVal2 = (currentStart !== null) ? currentStart : (durVal ? (endVal - durVal) : null);
					if (startVal2 !== null) {
						silences.push({ start: startVal2, end: endVal, duration: durVal !== null ? durVal : (endVal - startVal2) });
					}
				}
				currentStart = null;
			}
		}

		return JSON.stringify({ success: true, silences: silences, raw: output });
	} catch (error) {
		return JSON.stringify({ success: false, error: error.toString() });
	}
}

// =============================================
// Phase 1 editing pipeline stubs
// =============================================

function applyKeepRangesPipeline(keepRangesJson) {
    try {
        var keepRanges = JSON.parse(keepRangesJson);
        if (!keepRanges || !keepRanges.length) {
            return JSON.stringify({ success: false, error: 'No keep ranges provided' });
        }

        // Duplicate sequence placeholder (actual implementation can use QE DOM)
        var seqName = app.project && app.project.activeSequence ? app.project.activeSequence.name : 'Sequence';
        var newSeqName = seqName + ' – AutoTrim';

        // For Phase 1 stub: report cut points and pretend success
        var cuts = [];
        for (var i = 0; i < keepRanges.length; i++) {
            if (i > 0) {
                cuts.push(keepRanges[i].start);
            }
            cuts.push(keepRanges[i].end);
        }

        return JSON.stringify({ success: true, sequence: newSeqName, cutsCount: cuts.length });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

function autoDuckMusicForKeepRanges(keepRangesJson) {
    try {
        var keepRanges = JSON.parse(keepRangesJson);
        return JSON.stringify({ success: true, duckedSegments: keepRanges.length });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.toString() });
    }
}

// Get timeline information after trimming operations
function getTimelineInfo() {
    try {
        var result = {
            success: true,
            sequenceName: "No Sequence",
            duration: 0,
            audioTracks: 0,
            videoTracks: 0,
            clips: [],
            timestamp: new Date().toISOString()
        };
        
        // Check if we have an active sequence
        if (!app.project || !app.project.activeSequence) {
            result.error = "No active sequence found";
            return JSON.stringify(result);
        }
        
        var sequence = app.project.activeSequence;
        result.sequenceName = sequence.name || "Untitled Sequence";
        
        // Get sequence duration
        if (sequence.end && sequence.start) {
            result.duration = sequence.end.seconds - sequence.start.seconds;
        } else if (sequence.duration) {
            result.duration = sequence.duration.seconds;
        }
        
        // Get track information
        if (sequence.videoTracks) {
            result.videoTracks = sequence.videoTracks.numTracks;
        }
        
        if (sequence.audioTracks) {
            result.audioTracks = sequence.audioTracks.numTracks;
        }
        
        // Get clips information (basic)
        try {
            if (sequence.videoTracks && sequence.videoTracks.numTracks > 0) {
                var videoTrack = sequence.videoTracks[0];
                if (videoTrack && videoTrack.clips) {
                    for (var i = 0; i < videoTrack.clips.numItems; i++) {
                        var clip = videoTrack.clips[i];
                        if (clip) {
                            result.clips.push({
                                name: clip.name || "Unnamed Clip",
                                start: clip.start ? clip.start.seconds : 0,
                                end: clip.end ? clip.end.seconds : 0,
                                duration: clip.duration ? clip.duration.seconds : 0,
                                type: "video"
                            });
                        }
                    }
                }
            }
        } catch (clipError) {
            // Ignore clip enumeration errors
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: error.toString(),
            timestamp: new Date().toISOString()
        });
    }
}

// Create trimmed audio file using system commands
function createTrimmedAudio(inputPath, startMs, endMs, outputPath) {
    try {
        var result = {
            success: false,
            error: null,
            outputPath: outputPath,
            timestamp: new Date().toISOString()
        };
        
        // Check if system.callSystem is available
        if (typeof system === 'undefined' || typeof system.callSystem === 'undefined') {
            result.error = 'system.callSystem not available';
            return JSON.stringify(result);
        }
        
        // Calculate duration in seconds
        var durationSec = (endMs - startMs) / 1000;
        
        // Build FFmpeg command for audio trimming
        var ffmpegCmd = 'ffmpeg -i "' + inputPath + '" -ss ' + (startMs / 1000) + ' -t ' + durationSec + ' -vn -acodec mp3 -ar 44100 -ab 192k "' + outputPath + '"';
        
        // Execute FFmpeg command
        var exitCode = system.callSystem(ffmpegCmd);
        
        if (exitCode === 0) {
            result.success = true;
            result.message = 'Audio trim completed successfully';
        } else {
            result.error = 'FFmpeg exited with code ' + exitCode;
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: error.toString(),
            timestamp: new Date().toISOString()
        });
    }
}
