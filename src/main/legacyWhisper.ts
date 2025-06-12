import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { Blob } from 'buffer';

export class LegacyWhisper {
  /**
   * Upload audio buffer to Whisper API as fallback
   */
  static async upload(audioBuffer: ArrayBuffer[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    console.log('🔄 Falling back to legacy Whisper API...');

    try {
      // Combine all audio chunks into single buffer
      const totalLength = audioBuffer.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const combinedBuffer = new ArrayBuffer(totalLength);
      const combinedView = new Uint8Array(combinedBuffer);
      
      let offset = 0;
      for (const chunk of audioBuffer) {
        const chunkView = new Uint8Array(chunk);
        combinedView.set(chunkView, offset);
        offset += chunk.byteLength;
      }

      console.log(`📦 Combined audio: ${totalLength} bytes from ${audioBuffer.length} chunks`);

      // Create FormData with audio file
      const formData = new FormData();
      const audioBlob = new Blob([combinedBuffer], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');

      // Send to Whisper API - cast FormData to any to resolve type issue
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData as any
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error: ${response.status} ${errorText}`);
      }

      const transcript = await response.text();
      console.log(`🎯 Whisper fallback transcript: "${transcript}"`);
      
      return transcript.trim();
    } catch (error) {
      console.error('❌ Legacy Whisper upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Legacy Whisper fallback failed: ${errorMessage}`);
    }
  }

  /**
   * Convert PCM16 audio chunks to WAV format
   */
  static createWavFile(audioBuffer: ArrayBuffer[], sampleRate: number = 16000): ArrayBuffer {
    const totalSamples = audioBuffer.reduce((sum, chunk) => sum + chunk.byteLength / 2, 0);
    const wavLength = 44 + totalSamples * 2; // WAV header + data
    
    const wavBuffer = new ArrayBuffer(wavLength);
    const view = new DataView(wavBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
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
    let offset = 44;
    for (const chunk of audioBuffer) {
      const int16View = new Int16Array(chunk);
      for (let i = 0; i < int16View.length; i++) {
        view.setInt16(offset, int16View[i], true);
        offset += 2;
      }
    }
    
    return wavBuffer;
  }
} 