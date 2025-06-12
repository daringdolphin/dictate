import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { Settings, AppState, SettingsUpdatedMessage } from '../common/types';
import { IPC } from '../common/ipcChannels';
import { SystemTray } from './tray';
import { TranscriptHistory } from './history';
import { ClipboardManager } from './clipboard';
import { ShortcutManager } from './shortcut';
import { RealtimeTranscriber } from './realtimeTranscriber';

class VoiceClipApp {
  private overlayWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private recorderWindow: BrowserWindow | null = null;

  // Core modules
  private tray: SystemTray;
  private history: TranscriptHistory;
  private clipboard: ClipboardManager;
  private shortcut: ShortcutManager;
  private transcriber: RealtimeTranscriber;

  // Runtime settings (in-memory only)
  private settings: Settings = {
    hotkey: 'Ctrl+Shift+Space',
    toast: true
  };

  private currentState: AppState = 'idle';

  constructor() {
    // Initialize core modules
    this.tray = new SystemTray();
    this.history = new TranscriptHistory();
    this.clipboard = new ClipboardManager();
    this.shortcut = new ShortcutManager();
    this.transcriber = new RealtimeTranscriber();

    // Handle app events
    app.whenReady().then(() => {
      this.initialize();
    });

    app.on('window-all-closed', () => {
      // On Windows, apps typically stay running until explicitly quit
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      // On macOS, re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        this.initialize();
      }
    });

    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize all components
      await this.createWindows();
      this.setupTray();
      this.setupShortcuts();
      this.setupEventHandlers();
      this.setupIPCHandlers();

      console.log('VoiceClip app initialized successfully');
    } catch (error) {
      console.error('Error initializing VoiceClip:', error);
    }
  }

  private async createWindows(): Promise<void> {
    // Get screen dimensions for positioning
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Create the overlay window (hidden by default)
    this.overlayWindow = new BrowserWindow({
      width: 220,
      height: 220,
      x: screenWidth - 240, // Bottom-right corner with 20px margin
      y: screenHeight - 240,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false, // Prevent stealing focus
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/overlay/preload.js')
      }
    });

    // Make window click-through
    this.overlayWindow.setIgnoreMouseEvents(true);

    // Load the overlay HTML
    const overlayPath = path.join(__dirname, '../renderer/overlay/index.html');
    await this.overlayWindow.loadFile(overlayPath);

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.overlayWindow.webContents.openDevTools();
    }

    console.log('Overlay window created (hidden)');

    // Create the recorder window (hidden)
    this.recorderWindow = new BrowserWindow({
      width: 400,
      height: 300,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/recorder/preload.js')
      }
    });

    // Load the recorder HTML
    const recorderPath = path.join(__dirname, '../renderer/recorder/index.html');
    await this.recorderWindow.loadFile(recorderPath);

    console.log('Recorder window created (hidden)');
  }

  private setupTray(): void {
    // Initialize system tray
    this.tray.initialize();

    // Handle tray events
    this.tray.on('copy-transcript', (transcriptId: string) => {
      const transcript = this.history.getById(transcriptId);
      if (transcript) {
        this.clipboard.copyAndPaste(transcript.text);
        console.log(`Copied transcript from tray: ${transcript.text.substring(0, 30)}...`);
      }
    });

    this.tray.on('show-settings', () => {
      this.showSettingsWindow();
    });

    console.log('System tray initialized');
  }

  private setupShortcuts(): void {
    // Register global shortcut
    const success = this.shortcut.registerHotkey(this.settings.hotkey);
    if (!success) {
      console.error('Failed to register global shortcut');
      this.updateAppState('error');
      return;
    }

    console.log(`Global shortcut registered: ${this.settings.hotkey}`);
  }

  private setupEventHandlers(): void {
    // Shortcut events
    this.shortcut.on('recording-start', () => {
      this.handleRecordingStart();
    });

    this.shortcut.on('recording-stop', () => {
      this.handleRecordingStop();
    });

    this.shortcut.on('recording-cancel', () => {
      this.handleRecordingCancel();
    });
  }

  private setupIPCHandlers(): void {
    // Settings IPC handlers
    ipcMain.handle('get-current-settings', () => {
      return this.settings;
    });

    ipcMain.on(IPC.settingsUpdated, (event, data: SettingsUpdatedMessage) => {
      this.updateSettings(data.settings);
    });

    // Microphone permission handlers
    ipcMain.on(IPC.micPermissionSuccess, () => {
      console.log('✅ Microphone permission granted');
    });

    ipcMain.on(IPC.micPermissionError, (event, errorMessage: string) => {
      console.error('❌ Microphone permission error:', errorMessage);
      this.handleRecordingError(new Error(errorMessage));
    });

    console.log('IPC handlers setup complete');
  }

  /**
   * Setup audio chunk handling and IPC for Step 10 back-pressure
   */
  private setupAudioHandling(): void {
    // TODO: Will be called when recorder window sends audio chunks
    // For now, just log that setup is complete
    console.log('📊 Audio handling setup complete');
  }

  /**
   * Handle audio chunks from recorder window (Step 10)
   */
  private handleAudioChunk(buffer: ArrayBuffer): void {
    if (!this.transcriber.recording) {
      return;
    }

    // Check for back-pressure and pause if needed
    if (this.transcriber.isBackPressured) {
      console.warn('🚦 Back-pressure detected, pausing audio input');
      // TODO: Send pause signal to recorder window via IPC
      return;
    }

    // Send audio chunk to transcriber
    this.transcriber.append(buffer);
  }

  private async handleRecordingStart(): Promise<void> {
    console.log('🎤 Recording started');
    this.updateAppState('recording');
    
    // Show overlay
    if (this.overlayWindow) {
      this.overlayWindow.show();
      // Send recording start event to overlay
      this.overlayWindow.webContents.send(IPC.recordingStart);
      console.log('Overlay window shown');
    }

    try {
      // Start RealtimeTranscriber
      await this.transcriber.start();
      
      // Setup transcriber event handlers
      this.transcriber.on('transcript-partial', (draft: string) => {
        // Forward to overlay window for live preview
        if (this.overlayWindow) {
          this.overlayWindow.webContents.send(IPC.transcriptPartial, draft);
        }
        console.log(`📝 Live draft: "${draft}"`);
      });

      this.transcriber.on('error', (error: Error) => {
        console.error('Transcriber error:', error);
        this.handleRecordingError(error);
      });

      // Request microphone permission via recorder window
      if (this.recorderWindow) {
        this.recorderWindow.webContents.send(IPC.startMicCapture);
      }
      
      // Setup audio chunk handling
      this.setupAudioHandling();
      
      console.log('✅ Recording session ready');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.handleRecordingCancel();
    }
  }

  private async handleRecordingStop(): Promise<void> {
    console.log('⏹️ Recording stopped');
    this.updateAppState('transcribing');
    
    // Send recording stop event to overlay
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send(IPC.recordingStop);
    }

    try {
      // Stop RealtimeTranscriber and get final transcript
      const startTime = Date.now();
      const transcript = await this.transcriber.stop();
      const durationSec = (Date.now() - startTime) / 1000;
      
      await this.handleTranscriptReceived(transcript, durationSec);
    } catch (error) {
      console.error('Failed to get transcript:', error);
      this.handleRecordingCancel();
    }
  }

  private handleRecordingCancel(): void {
    console.log('❌ Recording cancelled');
    this.updateAppState('idle');
    
    // Cancel transcriber
    this.transcriber.cancel();
    
    // Send cancel event and hide overlay without copying/pasting
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send(IPC.recordingCancel);
      this.overlayWindow.hide();
      console.log('Overlay window hidden (cancelled)');
    }
  }

  private handleRecordingError(error: Error): void {
    console.error('❌ Recording error:', error);
    this.updateAppState('error');
    
    // Cancel transcriber
    this.transcriber.cancel();
    
    // Send error event to overlay
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send(IPC.recordingError, error.message);
      console.log('Overlay window showing error');
    }
  }

  private async handleTranscriptReceived(text: string, durationSec: number): Promise<void> {
    console.log(`📝 Transcript received: "${text}"`);
    
    // Send final transcript to overlay
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send(IPC.transcriptFinal, text);
    }
    
    // Add to history
    const transcript = this.history.push(text, durationSec);
    
    // Update tray with new history
    this.tray.updateHistory(this.history.list());
    
    // Copy and paste
    const pasteSuccess = await this.clipboard.copyAndPaste(text);
    
    // Show toast if paste failed and setting is enabled
    if (!pasteSuccess && this.settings.toast) {
      // Send toast notification to overlay (Step 16)
      if (this.overlayWindow) {
        this.overlayWindow.webContents.send(IPC.showToast, {
          message: 'Copied to clipboard',
          type: 'info'
        });
      }
      console.log('📋 Text copied to clipboard (paste failed) - toast shown');
    }
    
    // Hide overlay after a delay (overlay will fade itself)
    setTimeout(() => {
      if (this.overlayWindow) {
        this.overlayWindow.hide();
        console.log('Overlay window hidden (completed)');
      }
      this.updateAppState('idle');
    }, 1000); // Increased delay to allow for fade animation
  }

  private updateAppState(state: AppState): void {
    this.currentState = state;
    this.tray.updateState(state);
    console.log(`App state changed to: ${state}`);
  }

  private showSettingsWindow(): void {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      show: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/settings/preload.js')
      }
    });

    const settingsPath = path.join(__dirname, '../renderer/settings/index.html');
    this.settingsWindow.loadFile(settingsPath);

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    console.log('Settings window opened');
  }

  public updateSettings(newSettings: Settings): void {
    const oldHotkey = this.settings.hotkey;
    this.settings = { ...newSettings };
    
    // Update hotkey if changed
    if (oldHotkey !== newSettings.hotkey) {
      const success = this.shortcut.updateHotkey(newSettings.hotkey);
      if (!success) {
        console.error('Failed to update hotkey, reverting to previous');
        this.settings.hotkey = oldHotkey;
      }
    }
    
    console.log('Settings updated:', this.settings);
  }

  private cleanup(): void {
    try {
      this.shortcut.destroy();
      this.tray.destroy();
      console.log('App cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize the application
new VoiceClipApp(); 