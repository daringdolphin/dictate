import { globalShortcut } from 'electron';
import { EventEmitter } from 'events';
import { Settings } from '../common/types';

export class ShortcutManager extends EventEmitter {
  private currentHotkey: string = 'Ctrl+Shift+Space';
  private isRecording: boolean = false;
  private cancelShortcut: string = 'Escape';
  private cancelRegistered: boolean = false;

  constructor() {
    super();
    console.log('Shortcut manager initialized');
  }

  /**
   * Register the main recording hotkey
   */
  public registerHotkey(hotkey?: string): boolean {
    if (hotkey) {
      this.currentHotkey = hotkey;
    }

    try {
      // Unregister existing hotkey if any
      this.unregisterHotkey();

      // Register the new hotkey
      const success = globalShortcut.register(this.currentHotkey, () => {
        this.handleHotkeyPress();
      });

      if (success) {
        console.log(`Global shortcut registered: ${this.currentHotkey}`);
        return true;
      } else {
        console.error(`Failed to register global shortcut: ${this.currentHotkey}`);
        // Try fallback to default if current failed
        if (this.currentHotkey !== 'Ctrl+Shift+Space') {
          console.log('Attempting fallback to default shortcut...');
          this.currentHotkey = 'Ctrl+Shift+Space';
          return this.registerHotkey();
        }
        return false;
      }
    } catch (error) {
      console.error('Error registering global shortcut:', error);
      return false;
    }
  }

  /**
   * Unregister the current hotkey
   */
  public unregisterHotkey(): void {
    try {
      if (globalShortcut.isRegistered(this.currentHotkey)) {
        globalShortcut.unregister(this.currentHotkey);
        console.log(`Global shortcut unregistered: ${this.currentHotkey}`);
      }
    } catch (error) {
      console.error('Error unregistering global shortcut:', error);
    }
  }

  /**
   * Handle the main hotkey press/release
   */
  private handleHotkeyPress(): void {
    if (!this.isRecording) {
      // Start recording
      this.startRecording();
    } else {
      // Stop recording (this handles key release)
      this.stopRecording();
    }
  }

  /**
   * Start recording session
   */
  private startRecording(): void {
    if (this.isRecording) return;

    this.isRecording = true;
    console.log('Recording started via hotkey');
    
    // Register cancel shortcut (Esc) only while recording
    this.registerCancelShortcut();
    
    // Emit start event
    this.emit('recording-start');
  }

  /**
   * Stop recording session
   */
  private stopRecording(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    console.log('Recording stopped via hotkey');
    
    // Unregister cancel shortcut
    this.unregisterCancelShortcut();
    
    // Emit stop event
    this.emit('recording-stop');
  }

  /**
   * Cancel recording session
   */
  private cancelRecording(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    console.log('Recording cancelled via Escape key');
    
    // Unregister cancel shortcut
    this.unregisterCancelShortcut();
    
    // Emit cancel event
    this.emit('recording-cancel');
  }

  /**
   * Register temporary Escape key for cancellation
   */
  private registerCancelShortcut(): void {
    try {
      if (!this.cancelRegistered) {
        const success = globalShortcut.register(this.cancelShortcut, () => {
          this.cancelRecording();
        });
        
        if (success) {
          this.cancelRegistered = true;
          console.log('Cancel shortcut (Escape) registered');
        } else {
          console.warn('Failed to register cancel shortcut');
        }
      }
    } catch (error) {
      console.error('Error registering cancel shortcut:', error);
    }
  }

  /**
   * Unregister the cancel shortcut
   */
  private unregisterCancelShortcut(): void {
    try {
      if (this.cancelRegistered) {
        globalShortcut.unregister(this.cancelShortcut);
        this.cancelRegistered = false;
        console.log('Cancel shortcut (Escape) unregistered');
      }
    } catch (error) {
      console.error('Error unregistering cancel shortcut:', error);
    }
  }

  /**
   * Update hotkey from settings
   */
  public updateHotkey(newHotkey: string): boolean {
    console.log(`Updating hotkey from ${this.currentHotkey} to ${newHotkey}`);
    return this.registerHotkey(newHotkey);
  }

  /**
   * Get current hotkey
   */
  public getCurrentHotkey(): string {
    return this.currentHotkey;
  }

  /**
   * Get recording state
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if hotkey is available
   */
  public isHotkeyAvailable(hotkey: string): boolean {
    try {
      // Try to register temporarily to check availability
      const available = globalShortcut.register(hotkey, () => {});
      if (available) {
        globalShortcut.unregister(hotkey);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup all shortcuts
   */
  public destroy(): void {
    try {
      this.unregisterHotkey();
      this.unregisterCancelShortcut();
      globalShortcut.unregisterAll();
      console.log('All shortcuts unregistered');
    } catch (error) {
      console.error('Error during shortcut cleanup:', error);
    }
  }
} 