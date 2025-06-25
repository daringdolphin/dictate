import { EventEmitter } from 'events';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import { LegacyWhisper } from './legacyWhisper';
import {
  TranscriptionSessionResponse,
  TranscriptionSessionUpdateMessage,
  InputAudioBufferAppendMessage,
  TranscriptTextDeltaMessage,
  TranscriptTextDoneMessage
} from '../common/types';

export interface RealtimeTranscriberEvents {
  'transcript-partial': (draft: string) => void;
  'transcript-final': (text: string) => void;
  'error': (error: Error) => void;
}

export declare interface RealtimeTranscriber {
  on<U extends keyof RealtimeTranscriberEvents>(
    event: U, listener: RealtimeTranscriberEvents[U]
  ): this;
  emit<U extends keyof RealtimeTranscriberEvents>(
    event: U, ...args: Parameters<RealtimeTranscriberEvents[U]>
  ): boolean;
}

export class RealtimeTranscriber extends EventEmitter {
  private socket: WebSocket | null = null;
  private session: TranscriptionSessionResponse | null = null;
  private audioBuffer: ArrayBuffer[] = [];
  private isRecording = false;
  private finalTranscript = '';
  private currentDraft = '';

  constructor() {
    super();
  }

  /**
   * Initialize transcription session and WebSocket connection
   */
  async start(): Promise<void> {
    console.log('🎤 Starting RealtimeTranscriber...');
    
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    this.isRecording = true;
    this.audioBuffer = [];
    this.finalTranscript = '';
    this.currentDraft = '';

    try {
      // Step 9: Create transcription session via OpenAI API
      await this.createTranscriptionSession();
      
      // Step 9: Open WebSocket connection
      await this.openWebSocketConnection();
      
      // Step 9: Send initial session configuration
      await this.sendSessionUpdate();
      
      console.log('📋 RealtimeTranscriber started successfully');
    } catch (error) {
      this.isRecording = false;
      console.error('Failed to start RealtimeTranscriber:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Create transcription session via OpenAI REST API
   */
  private async createTranscriptionSession(): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    console.log('🔑 Creating transcription session...');

    const response = await fetch('https://api.openai.com/v1/realtime/transcription_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'transcription'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create transcription session: ${response.status} ${errorText}`);
    }

    this.session = await response.json() as TranscriptionSessionResponse;
    console.log(`📋 Session created: ${this.session.id}`);
  }

  /**
   * Open WebSocket connection to OpenAI Realtime API
   */
  private async openWebSocketConnection(): Promise<void> {
    if (!this.session) {
      throw new Error('No transcription session available');
    }

    console.log('🔌 Opening WebSocket connection...');

    return new Promise((resolve, reject) => {
      const wsUrl = 'wss://api.openai.com/v1/realtime?intent=transcription';
      
      this.socket = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Bearer ${this.session!.client_secret}`
        }
      });

      const connectTimeout = setTimeout(() => {
        if (this.socket?.readyState !== WebSocket.OPEN) {
          this.socket?.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000); // 10 second timeout

      this.socket.on('open', () => {
        clearTimeout(connectTimeout);
        console.log('✅ WebSocket connected');
        this.setupWebSocketHandlers();
        resolve();
      });

      this.socket.on('error', (error) => {
        clearTimeout(connectTimeout);
        console.error('❌ WebSocket error:', error);
        reject(error);
      });
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    this.socket.on('close', (code: number, reason: Buffer) => {
      console.log(`🔌 WebSocket closed: ${code} ${reason.toString()}`);
      
      if (code !== 1000 && this.isRecording) {
        // Unexpected close, emit error
        this.emit('error', new Error(`WebSocket closed unexpectedly: ${code}`));
      }
      
      this.socket = null;
    });

    this.socket.on('error', (error: Error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: any): void {
    console.log('📨 Received message:', message.type);

    switch (message.type) {
      case 'transcript.text.delta':
        const deltaMsg = message as TranscriptTextDeltaMessage;
        this.currentDraft += deltaMsg.text.delta;
        this.emit('transcript-partial', this.currentDraft);
        console.log(`📝 Draft update: "${this.currentDraft}"`);
        break;

      case 'transcript.text.done':
        const doneMsg = message as TranscriptTextDoneMessage;
        this.finalTranscript = doneMsg.text.value;
        this.emit('transcript-final', this.finalTranscript);
        console.log(`✅ Final transcript: "${this.finalTranscript}"`);
        break;

      default:
        console.log(`📋 Unhandled message type: ${message.type}`);
    }
  }

  /**
   * Send transcription session update message
   */
  private async sendSessionUpdate(): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const updateMessage: TranscriptionSessionUpdateMessage = {
      type: 'transcription_session.update',
      input_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'gpt-4o-mini-transcribe',
        language: 'en'
      },
      turn_detection: null
    };

    this.socket.send(JSON.stringify(updateMessage));
    console.log('📤 Sent session update message');
  }

  /**
   * Append audio chunk to the stream with back-pressure handling
   */
  append(buffer: ArrayBuffer): void {
    if (!this.isRecording) {
      console.warn('Cannot append audio: not recording');
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot append audio: WebSocket not connected');
      return;
    }

    // Step 10: Check for back-pressure (256 KiB = 262144 bytes)
    const BACK_PRESSURE_THRESHOLD = 262144;
    if (this.socket.bufferedAmount > BACK_PRESSURE_THRESHOLD) {
      console.warn(`🚦 Back-pressure detected: ${this.socket.bufferedAmount} bytes buffered, dropping chunk`);
      this.emit('error', new Error('WebSocket buffer overflow - pausing audio stream'));
      return;
    }

    try {
      // Step 10: Convert ArrayBuffer to base64
      const base64Audio = this.arrayBufferToBase64(buffer);
      
      // Step 10: Send input_audio_buffer.append message
      const appendMessage: InputAudioBufferAppendMessage = {
        type: 'input_audio_buffer.append',
        audio: base64Audio
      };

      this.socket.send(JSON.stringify(appendMessage));
      
      // Store in local buffer for fallback purposes
      this.audioBuffer.push(buffer);
      
      console.log(`📊 Audio chunk sent: ${buffer.byteLength} bytes (buffered: ${this.socket.bufferedAmount} bytes)`);
    } catch (error) {
      console.error('Failed to send audio chunk:', error);
      this.emit('error', error as Error);
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
  }

  /**
   * Check if WebSocket is experiencing back-pressure
   */
  get isBackPressured(): boolean {
    if (!this.socket) return false;
    return this.socket.bufferedAmount > 262144; // 256 KiB
  }

  /**
   * Stop recording and get final transcript
   */
  async stop(): Promise<string> {
    console.log('⏹️ Stopping RealtimeTranscriber...');
    
    if (!this.isRecording) {
      throw new Error('Not recording');
    }

    this.isRecording = false;

    try {
      // Step 11: Wait for final transcript from WebSocket
      const transcript = await this.waitForFinalTranscript();
      console.log(`📝 RealtimeTranscriber stopped with transcript: "${transcript}"`);
      return transcript;
    } catch (error) {
      console.warn('Realtime transcription failed, falling back to Whisper:', error);
      
      // Step 11: Fallback to legacy Whisper API
      try {
        const fallbackTranscript = await LegacyWhisper.upload(this.audioBuffer);
        console.log(`🔄 Fallback transcript: "${fallbackTranscript}"`);
        return fallbackTranscript;
      } catch (fallbackError) {
        console.error('Both realtime and fallback transcription failed:', fallbackError);
        throw new Error('Transcription failed completely');
      }
    } finally {
      // Clean up resources
      this.closeWebSocket();
    }
  }

  /**
   * Wait for final transcript with timeout
   */
  private async waitForFinalTranscript(): Promise<string> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      // Set timeout for waiting (5 seconds)
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for final transcript'));
      }, 5000);

      // Listen for final transcript
      const onFinalTranscript = (transcript: string) => {
        clearTimeout(timeout);
        this.off('transcript-final', onFinalTranscript);
        this.off('error', onError);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.close(1000);
        }
        resolve(transcript);
      };

      // Listen for errors
      const onError = (error: unknown) => {
        clearTimeout(timeout);
        this.off('transcript-final', onFinalTranscript);
        this.off('error', onError);
        reject(error);
      };

      this.on('transcript-final', onFinalTranscript);
      this.on('error', onError);
      // Wait for the server to send the final transcript before closing
    });
  }

  /**
   * Close WebSocket connection cleanly
   */
  private closeWebSocket(): void {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000);
      }
      this.socket = null;
    }
    this.session = null;
  }

  /**
   * Cancel recording without getting transcript
   */
  cancel(): void {
    console.log('❌ Cancelling RealtimeTranscriber...');
    
    if (this.socket) {
      this.socket.close(1000);
      this.socket = null;
    }
    
    this.isRecording = false;
    this.audioBuffer = [];
    this.finalTranscript = '';
    this.currentDraft = '';
    this.session = null;
  }

  /**
   * Get current recording state
   */
  get recording(): boolean {
    return this.isRecording;
  }

  /**
   * Get total audio buffer size
   */
  get bufferSize(): number {
    return this.audioBuffer.reduce((total, chunk) => total + chunk.byteLength, 0);
  }
} 