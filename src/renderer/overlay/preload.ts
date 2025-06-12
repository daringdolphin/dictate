import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC functionality to the renderer process in a secure way
contextBridge.exposeInMainWorld('electronAPI', {
  // Listen to IPC events
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  
  // Remove IPC event listeners
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  
  // Send IPC messages (for future use)
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  }
});

// For backward compatibility with existing code
contextBridge.exposeInMainWorld('require', (module: string) => {
  if (module === 'electron') {
    return { ipcRenderer };
  }
  throw new Error(`Module ${module} is not allowed`);
}); 