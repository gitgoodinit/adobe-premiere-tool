/**
 * File Utilities
 * Helper functions for file operations
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Logger = require('./logger');

class FileUtils {
    constructor() {
        this.logger = new Logger();
    }

    /**
     * Generate temporary file path
     * @param {string} extension - File extension
     * @param {string} prefix - Optional prefix
     * @returns {string} Temporary file path
     */
    generateTempPath(extension = '.tmp', prefix = '') {
        const tempDir = path.join(__dirname, '../../temp');
        if (!fsSync.existsSync(tempDir)) {
            fsSync.mkdirSync(tempDir, { recursive: true });
        }
        
        const filename = prefix ? `${prefix}_${uuidv4()}${extension}` : `${uuidv4()}${extension}`;
        return path.join(tempDir, filename);
    }

    /**
     * Delete file safely
     * @param {string} filePath - Path to file
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(filePath) {
        try {
            if (fsSync.existsSync(filePath)) {
                await fs.unlink(filePath);
                this.logger.debug(`Deleted file: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Failed to delete file: ${filePath}`, error);
            return false;
        }
    }

    /**
     * Clean up uploaded files
     * @param {Array} files - Array of uploaded files
     */
    async cleanupUploadedFiles(files) {
        if (!files || !Array.isArray(files)) {
            return;
        }

        for (const file of files) {
            try {
                if (file.path && await this.fileExists(file.path)) {
                    await this.deleteFile(file.path);
                    this.logger.debug(`Cleaned up uploaded file: ${file.path}`);
                }
            } catch (error) {
                this.logger.error(`Failed to cleanup uploaded file ${file.path}:`, error);
            }
        }
    }

    /**
     * Check if file exists
     * @param {string} filePath - Path to check
     * @returns {Promise<boolean>}
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete files by pattern
     * @param {string} directory - Directory to search
     * @param {RegExp} pattern - Pattern to match filenames
     * @returns {Promise<number>} Number of files deleted
     */
    async deleteFilesByPattern(directory, pattern) {
        try {
            if (!fsSync.existsSync(directory)) {
                return 0;
            }

            const files = await fs.readdir(directory);
            let deletedCount = 0;

            for (const file of files) {
                if (pattern.test(file)) {
                    const filePath = path.join(directory, file);
                    if (await this.deleteFile(filePath)) {
                        deletedCount++;
                    }
                }
            }

            return deletedCount;
        } catch (error) {
            this.logger.error('Failed to delete files by pattern:', error);
            return 0;
        }
    }

    /**
     * Clean up old temporary files
     * @param {number} maxAgeHours - Maximum age in hours
     * @returns {Promise<number>} Number of files deleted
     */
    async cleanupOldTempFiles(maxAgeHours = 24) {
        try {
            const tempDir = path.join(__dirname, '../../temp');
            if (!fsSync.existsSync(tempDir)) {
                return 0;
            }

            const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
            const files = await fs.readdir(tempDir);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                try {
                    const stats = await fs.stat(filePath);
                    if (stats.mtime < cutoffTime) {
                        if (await this.deleteFile(filePath)) {
                            deletedCount++;
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Could not check file stats for ${filePath}:`, error.message);
                }
            }

            return deletedCount;
        } catch (error) {
            this.logger.error('Failed to cleanup old temp files:', error);
            return 0;
        }
    }

    /**
     * Calculate file hash
     * @param {string} filePath - Path to file
     * @param {string} algorithm - Hash algorithm (default: sha256)
     * @returns {Promise<string>} File hash
     */
    async calculateFileHash(filePath, algorithm = 'sha256') {
        return new Promise((resolve, reject) => {
            try {
                const hash = crypto.createHash(algorithm);
                const stream = fsSync.createReadStream(filePath);

                stream.on('data', (data) => {
                    hash.update(data);
                });

                stream.on('end', () => {
                    resolve(hash.digest('hex'));
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Ensure directory exists
     * @param {string} dirPath - Directory path
     * @returns {boolean} Success status
     */
    ensureDirectoryExists(dirPath) {
        try {
            if (!fsSync.existsSync(dirPath)) {
                fsSync.mkdirSync(dirPath, { recursive: true });
                this.logger.debug(`Created directory: ${dirPath}`);
            }
            return true;
        } catch (error) {
            this.logger.error(`Failed to create directory: ${dirPath}`, error);
            return false;
        }
    }

    /**
     * Get directory size
     * @param {string} dirPath - Directory path
     * @returns {Promise<number>} Directory size in bytes
     */
    async getDirectorySize(dirPath) {
        try {
            if (!fsSync.existsSync(dirPath)) {
                return 0;
            }

            let totalSize = 0;
            const files = await fs.readdir(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory()) {
                    totalSize += await this.getDirectorySize(filePath);
                } else {
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch (error) {
            this.logger.error('Failed to calculate directory size:', error);
            return 0;
        }
    }

    /**
     * Copy file
     * @param {string} source - Source file path
     * @param {string} destination - Destination file path
     * @returns {Promise<boolean>} Success status
     */
    async copyFile(source, destination) {
        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destination);
            this.ensureDirectoryExists(destDir);

            // Copy file
            await fs.copyFile(source, destination);
            this.logger.debug(`Copied file: ${source} -> ${destination}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to copy file: ${source} -> ${destination}`, error);
            return false;
        }
    }

    /**
     * Move file
     * @param {string} source - Source file path
     * @param {string} destination - Destination file path
     * @returns {Promise<boolean>} Success status
     */
    async moveFile(source, destination) {
        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destination);
            this.ensureDirectoryExists(destDir);

            // Move file
            await fs.rename(source, destination);
            this.logger.debug(`Moved file: ${source} -> ${destination}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to move file: ${source} -> ${destination}`, error);
            return false;
        }
    }

    /**
     * Check if file is audio format
     * @param {string} filename - Filename or path
     * @returns {boolean} True if audio format
     */
    isAudioFile(filename) {
        const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma'];
        const ext = path.extname(filename).toLowerCase();
        return audioExtensions.includes(ext);
    }

    /**
     * Get supported audio formats
     * @returns {Object} Supported formats
     */
    getSupportedAudioFormats() {
        return {
            input: ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma'],
            output: ['.mp3', '.wav', '.m4a', '.ogg'],
            mimeTypes: {
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.m4a': 'audio/mp4',
                '.ogg': 'audio/ogg',
                '.flac': 'audio/flac',
                '.aac': 'audio/aac'
            }
        };
    }
}

module.exports = FileUtils;