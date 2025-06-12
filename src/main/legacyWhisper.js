"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyWhisper = void 0;
var node_fetch_1 = require("node-fetch");
var formdata_node_1 = require("formdata-node");
var buffer_1 = require("buffer");
var LegacyWhisper = /** @class */ (function () {
    function LegacyWhisper() {
    }
    /**
     * Upload audio buffer to Whisper API as fallback
     */
    LegacyWhisper.upload = function (audioBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, totalLength, combinedBuffer, combinedView, offset, _i, audioBuffer_1, chunk, chunkView, formData, audioBlob, response, errorText, transcript, error_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        apiKey = process.env.OPENAI_API_KEY;
                        if (!apiKey) {
                            throw new Error('OPENAI_API_KEY environment variable is required');
                        }
                        console.log('🔄 Falling back to legacy Whisper API...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        totalLength = audioBuffer.reduce(function (sum, chunk) { return sum + chunk.byteLength; }, 0);
                        combinedBuffer = new ArrayBuffer(totalLength);
                        combinedView = new Uint8Array(combinedBuffer);
                        offset = 0;
                        for (_i = 0, audioBuffer_1 = audioBuffer; _i < audioBuffer_1.length; _i++) {
                            chunk = audioBuffer_1[_i];
                            chunkView = new Uint8Array(chunk);
                            combinedView.set(chunkView, offset);
                            offset += chunk.byteLength;
                        }
                        console.log("\uD83D\uDCE6 Combined audio: ".concat(totalLength, " bytes from ").concat(audioBuffer.length, " chunks"));
                        formData = new formdata_node_1.FormData();
                        audioBlob = new buffer_1.Blob([combinedBuffer], { type: 'audio/wav' });
                        formData.append('file', audioBlob, 'audio.wav');
                        formData.append('model', 'whisper-1');
                        formData.append('response_format', 'text');
                        return [4 /*yield*/, (0, node_fetch_1.default)('https://api.openai.com/v1/audio/transcriptions', {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(apiKey)
                                },
                                body: formData
                            })];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _a.sent();
                        throw new Error("Whisper API error: ".concat(response.status, " ").concat(errorText));
                    case 4: return [4 /*yield*/, response.text()];
                    case 5:
                        transcript = _a.sent();
                        console.log("\uD83C\uDFAF Whisper fallback transcript: \"".concat(transcript, "\""));
                        return [2 /*return*/, transcript.trim()];
                    case 6:
                        error_1 = _a.sent();
                        console.error('❌ Legacy Whisper upload failed:', error_1);
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                        throw new Error("Legacy Whisper fallback failed: ".concat(errorMessage));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convert PCM16 audio chunks to WAV format
     */
    LegacyWhisper.createWavFile = function (audioBuffer, sampleRate) {
        if (sampleRate === void 0) { sampleRate = 16000; }
        var totalSamples = audioBuffer.reduce(function (sum, chunk) { return sum + chunk.byteLength / 2; }, 0);
        var wavLength = 44 + totalSamples * 2; // WAV header + data
        var wavBuffer = new ArrayBuffer(wavLength);
        var view = new DataView(wavBuffer);
        // WAV header
        var writeString = function (offset, string) {
            for (var i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, wavLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // audio format (PCM)
        view.setUint16(22, 1, true); // num channels
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true); // byte rate
        view.setUint16(32, 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        writeString(36, 'data');
        view.setUint32(40, totalSamples * 2, true);
        // Copy audio data
        var offset = 44;
        for (var _i = 0, audioBuffer_2 = audioBuffer; _i < audioBuffer_2.length; _i++) {
            var chunk = audioBuffer_2[_i];
            var int16View = new Int16Array(chunk);
            for (var i = 0; i < int16View.length; i++) {
                view.setInt16(offset, int16View[i], true);
                offset += 2;
            }
        }
        return wavBuffer;
    };
    return LegacyWhisper;
}());
exports.LegacyWhisper = LegacyWhisper;
