"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptTextDone = exports.TranscriptTextDelta = exports.InputAudioBufferAppend = exports.TranscriptionSessionUpdate = void 0;
var zod_1 = require("zod");
// WebSocket message schemas (for OpenAI Realtime API)
exports.TranscriptionSessionUpdate = zod_1.z.object({
    type: zod_1.z.literal('transcription_session.update'),
    input_audio_format: zod_1.z.literal('pcm16'),
    input_audio_transcription: zod_1.z.object({
        model: zod_1.z.literal('gpt-4o-mini-transcribe'),
        language: zod_1.z.literal('en')
    }),
    turn_detection: zod_1.z.null()
});
exports.InputAudioBufferAppend = zod_1.z.object({
    type: zod_1.z.literal('input_audio_buffer.append'),
    audio: zod_1.z.string() // Base64 encoded PCM data
});
exports.TranscriptTextDelta = zod_1.z.object({
    type: zod_1.z.literal('transcript.text.delta'),
    text: zod_1.z.object({
        delta: zod_1.z.string()
    })
});
exports.TranscriptTextDone = zod_1.z.object({
    type: zod_1.z.literal('transcript.text.done'),
    text: zod_1.z.object({
        value: zod_1.z.string()
    })
});
