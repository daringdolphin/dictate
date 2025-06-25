// Recorder renderer entry point
// This will handle audio capture in future steps

console.log('Recorder renderer loaded');

// Access IPC through the preload bridge
const ipcRenderer = (window as any).electronAPI?.ipcRenderer;

function showInternalIpcFailure(): void {
  try {
    ipcRenderer?.send?.('recording-error', 'Internal IPC failure');
  } catch {
    if (typeof document !== 'undefined') {
      const container =
        document.getElementById('recorder-root') || document.body;
      if (container) {
        const el = document.createElement('div');
        el.textContent = 'Internal IPC failure';
        el.style.cssText = 'color:red;font-family:sans-serif;padding:8px';
        container.appendChild(el);
      }
    }
  }
}

function safeSend(channel: string, ...args: any[]): void {
  try {
    if (!ipcRenderer || typeof ipcRenderer.send !== 'function') {
      throw new Error('ipcRenderer unavailable');
    }
    ipcRenderer.send(channel, ...args);
  } catch (error) {
    console.error('IPC send failed:', error);
    showInternalIpcFailure();
  }
}

function safeOn(channel: string, listener: (...args: any[]) => void): void {
  try {
    if (!ipcRenderer || typeof ipcRenderer.on !== 'function') {
      throw new Error('ipcRenderer unavailable');
    }
    ipcRenderer.on(channel, listener);
  } catch (error) {
    console.error('IPC on failed:', error);
    showInternalIpcFailure();
  }
}

import workletCode from './audioWorkletProcessor';

let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let mediaStream: MediaStream | null = null;

// Create AudioContext and pipe mic audio through worklet
async function setupAudioHandling(): Promise<void> {
  try {
    console.log('Requesting microphone permission...');
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false
      }
    });

    safeSend('mic-permission-success');

    audioContext = new AudioContext({ sampleRate: 16000 });
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await audioContext.audioWorklet.addModule(url);

    workletNode = new AudioWorkletNode(audioContext, 'pcm-worklet', {
      numberOfInputs: 1,
      numberOfOutputs: 0
    });
    workletNode.port.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
      handleAudioChunk(ev.data);
    };

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(workletNode);

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    console.log('🎙️ Audio capture started');
  } catch (error: any) {
    console.error('❌ Microphone permission denied or failed:', error);

    let errorMessage = 'Microphone access denied';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Microphone permission denied';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Microphone already in use';
    }

    safeSend('mic-permission-error', errorMessage);
  }
}

function handleAudioChunk(chunk: ArrayBuffer): void {
  if (chunk.byteLength > 0) {
    safeSend('audio-chunk', chunk);
  }
}

safeOn('start-mic-capture', () => {
  setupAudioHandling();
});

export const __test__ = { safeSend, safeOn, showInternalIpcFailure };
