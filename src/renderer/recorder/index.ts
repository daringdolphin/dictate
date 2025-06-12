// Recorder renderer entry point
// This will handle audio capture in future steps

console.log('Recorder renderer loaded');

// Access IPC through the preload bridge (will need preload.js)
const ipcRenderer = (window as any).electronAPI?.ipcRenderer;

// Request microphone permission and handle errors
async function requestMicrophonePermission(): Promise<void> {
  try {
    console.log('Requesting microphone permission...');
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false
      } 
    });
    
    console.log('✅ Microphone permission granted');
    
    // Stop the stream for now (will be used in future audio implementation)
    stream.getTracks().forEach(track => track.stop());
    
    // Send success to main process
    ipcRenderer.send('mic-permission-success');
    
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
    
    // Send error to main process
    ipcRenderer.send('mic-permission-error', errorMessage);
  }
}

// Handle IPC events from main process
ipcRenderer.on('start-mic-capture', () => {
  requestMicrophonePermission();
});

// Placeholder for future audio worklet implementation
// Will be expanded in Step 6-7 of the implementation plan 