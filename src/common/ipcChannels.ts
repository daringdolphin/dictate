// IPC Channel definitions
export const IPC = {
  // Audio streaming
  audioChunk: 'audio-chunk',
  
  // Transcription updates
  transcriptPartial: 'transcript-partial',
  transcriptFinal: 'transcript-final',
  
  // Settings
  settingsUpdated: 'settings-updated',
  
  // UI updates
  overlayShow: 'overlay-show',
  overlayHide: 'overlay-hide',
  overlayUpdate: 'overlay-update',
  
  // Toast notifications
  showToast: 'show-toast',
  
  // Recording control
  recordingStart: 'recording-start',
  recordingStop: 'recording-stop',
  recordingCancel: 'recording-cancel',
  recordingError: 'recording-error',
  
  // Microphone permission
  startMicCapture: 'start-mic-capture',
  micPermissionSuccess: 'mic-permission-success',
  micPermissionError: 'mic-permission-error',
  
  // Tray interactions
  trayMenuClick: 'tray-menu-click',
  copyTranscript: 'copy-transcript',
  
  // Window management
  showSettings: 'show-settings',
  hideSettings: 'hide-settings',
  
  // App state
  appStateChanged: 'app-state-changed'
} as const;

// Type-safe channel names
export type IPCChannel = typeof IPC[keyof typeof IPC]; 