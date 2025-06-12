import { Tray, Menu, nativeImage, app } from 'electron';
import * as path from 'path';
import { AppState, Transcript } from '../common/types';
import { EventEmitter } from 'events';

export class SystemTray extends EventEmitter {
  private tray: Tray | null = null;
  private currentState: AppState = 'idle';
  private transcriptHistory: Transcript[] = [];

  constructor() {
    super();
  }

  public initialize(): void {
    // Create tray icon (using a default for now - will need actual icons later)
    const iconPath = this.getIconPath('idle');
    this.tray = new Tray(iconPath);

    // Set initial tooltip
    this.updateTooltip();

    // Set initial context menu
    this.updateContextMenu();

    console.log('System tray initialized');
  }

  public updateState(state: AppState): void {
    this.currentState = state;
    
    if (this.tray) {
      // Update icon
      const iconPath = this.getIconPath(state);
      this.tray.setImage(iconPath);
      
      // Update tooltip
      this.updateTooltip();
    }
  }

  public updateHistory(history: Transcript[]): void {
    this.transcriptHistory = history;
    this.updateContextMenu();
  }

  private getIconPath(state: AppState): Electron.NativeImage {
    switch (state) {
      case 'idle':
        // A simple grey square icon for idle
        return this.createIconFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="#808080"/></svg>');
      case 'recording':
        // A red circle for recording
        return this.createIconFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#FF0000"/></svg>');
      case 'transcribing':
        // A yellow hourglass for transcribing
        return this.createIconFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FFFF00" viewBox="0 0 16 16"><path d="M8.5 5.5a.5.5 0 0 0-1 0v1.143l-2.73 2.73a.5.5 0 0 0 .707.707L7.5 9.071V10.5a.5.5 0 0 0 1 0V9.071l2.023 2.023a.5.5 0 0 0 .707-.707L8.5 8.357V5.5z"/><path d="M6.5 1h3v1.5a.5.5 0 0 1-1 0V2h-1v.5a.5.5 0 0 1-1 0V1.5H6.5V1zM5 13.5h6v1.5a.5.5 0 0 1-1 0V14h-4v.5a.5.5 0 0 1-1 0v-1.5z"/></svg>');
      case 'error':
        // A red exclamation mark for error
        return this.createIconFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FF0000" viewBox="0 0 16 16"><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>');
      default:
        // A question mark for unknown state
        return this.createIconFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/></svg>');
    }
  }

  private createIconFromSvg(svgString: string): Electron.NativeImage {
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
    return nativeImage.createFromDataURL(dataUrl);
  }

  private updateTooltip(): void {
    if (!this.tray) return;

    const stateText = this.currentState.charAt(0).toUpperCase() + this.currentState.slice(1);
    this.tray.setToolTip(`VoiceClip - ${stateText}`);
  }

  private updateContextMenu(): void {
    if (!this.tray) return;

    const menuItems: Electron.MenuItemConstructorOptions[] = [];

    // Recent transcripts section
    if (this.transcriptHistory.length > 0) {
      menuItems.push({
        label: `Recent (${this.transcriptHistory.length})`,
        type: 'submenu',
        submenu: this.transcriptHistory.slice(0, 10).map((transcript, index) => ({
          label: this.truncateText(transcript.text, 20),
          click: () => {
            this.emit('copy-transcript', transcript.id);
          }
        }))
      });
      menuItems.push({ type: 'separator' });
    }

    // Settings
    menuItems.push({
      label: 'Settings...',
      click: () => {
        this.emit('show-settings');
      }
    });

    menuItems.push({ type: 'separator' });

    // Quit
    menuItems.push({
      label: 'Quit',
      click: () => {
        app.quit();
      }
    });

    const contextMenu = Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(contextMenu);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
} 