import { z } from 'zod';

// Core application types
export interface Settings {
  hotkey: string;
  toast: boolean;
}

export interface Transcript {
  id: string;               // UUID
  text: string;
  ts: number;               // epoch ms
  durationSec: number;
}

export type OverlayStatus = 'recording' | 'transcribing' | 'done' | 'cancelled' | 'error';

export interface OverlayProps {
  status: OverlayStatus;
  timerSec: number;
  draft?: string;
}

// IPC Message Types
export interface AudioChunkMessage {
  data: ArrayBuffer;
}

export interface TranscriptPartialMessage {
  draft: string;
}

export interface TranscriptFinalMessage {
  text: string;
}

export interface SettingsUpdatedMessage {
  settings: Settings;
}

export interface ToastMessage {
  message: string;
  type?: 'info' | 'error';
}

// App states
export type AppState = 'idle' | 'recording' | 'transcribing' | 'error';

// WebSocket message schemas (for OpenAI Realtime API)
export const TranscriptionSessionUpdate = z.object({
  type: z.literal('transcription_session.update'),
  input_audio_format: z.literal('pcm16'),
  input_audio_transcription: z.object({
    model: z.literal('gpt-4o-mini-transcribe'),
    language: z.literal('en')
  }),
  turn_detection: z.null()
});

export const InputAudioBufferAppend = z.object({
  type: z.literal('input_audio_buffer.append'),
  audio: z.string() // Base64 encoded PCM data
});

export const TranscriptTextDelta = z.object({
  type: z.literal('transcript.text.delta'),
  text: z.object({
    delta: z.string()
  })
});

export const TranscriptTextDone = z.object({
  type: z.literal('transcript.text.done'),
  text: z.object({
    value: z.string()
  })
});

// WebSocket message types
export type TranscriptionSessionUpdateMessage = z.infer<typeof TranscriptionSessionUpdate>;
export type InputAudioBufferAppendMessage = z.infer<typeof InputAudioBufferAppend>;
export type TranscriptTextDeltaMessage = z.infer<typeof TranscriptTextDelta>;
export type TranscriptTextDoneMessage = z.infer<typeof TranscriptTextDone>;

// Session creation response
export interface TranscriptionSessionResponse {
  id: string;
  client_secret: string;
  expires_at: string;
}