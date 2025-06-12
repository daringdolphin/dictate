"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptHistory = void 0;
var uuid_1 = require("uuid");
var TranscriptHistory = /** @class */ (function () {
    function TranscriptHistory() {
        this.history = [];
        this.maxSize = 20; // Circular buffer size
        console.log('Transcript history initialized');
    }
    /**
     * Add a new transcript to the history
     */
    TranscriptHistory.prototype.push = function (text, durationSec) {
        var transcript = {
            id: (0, uuid_1.v4)(),
            text: text.trim(),
            ts: Date.now(),
            durationSec: durationSec
        };
        // Add to beginning of array (most recent first)
        this.history.unshift(transcript);
        // Maintain circular buffer size
        if (this.history.length > this.maxSize) {
            this.history = this.history.slice(0, this.maxSize);
        }
        console.log("Added transcript to history: \"".concat(this.truncateText(text, 50), "\" (").concat(this.history.length, "/").concat(this.maxSize, ")"));
        return transcript;
    };
    /**
     * Get all transcripts, most recent first
     */
    TranscriptHistory.prototype.list = function () {
        return __spreadArray([], this.history, true); // Return copy to prevent mutation
    };
    /**
     * Get a specific transcript by ID
     */
    TranscriptHistory.prototype.getById = function (id) {
        return this.history.find(function (t) { return t.id === id; });
    };
    /**
     * Get recent transcripts with limit
     */
    TranscriptHistory.prototype.getRecent = function (limit) {
        if (limit === void 0) { limit = 10; }
        return this.history.slice(0, Math.min(limit, this.history.length));
    };
    /**
     * Get the count of stored transcripts
     */
    TranscriptHistory.prototype.count = function () {
        return this.history.length;
    };
    /**
     * Clear all transcripts (on app restart)
     */
    TranscriptHistory.prototype.clear = function () {
        this.history = [];
        console.log('Transcript history cleared');
    };
    /**
     * Get transcripts within a time range
     */
    TranscriptHistory.prototype.getInTimeRange = function (startTs, endTs) {
        return this.history.filter(function (t) { return t.ts >= startTs && t.ts <= endTs; });
    };
    TranscriptHistory.prototype.truncateText = function (text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    };
    return TranscriptHistory;
}());
exports.TranscriptHistory = TranscriptHistory;
