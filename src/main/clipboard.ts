import { clipboard } from 'electron';
import * as robot from 'robotjs';

export class ClipboardManager {
  constructor() {
    console.log('Clipboard manager initialized');
  }

  /**
   * Copy text to clipboard and attempt to paste it
   * Returns true if paste was likely successful, false if toast should be shown
   */
  public async copyAndPaste(text: string): Promise<boolean> {
    try {
      // Always copy to clipboard first
      clipboard.writeText(text);
      console.log(`Text copied to clipboard: "${this.truncateText(text, 50)}"`);

      // Attempt to detect if there's an editable control and paste
      const pasteSuccess = await this.attemptPaste();
      
      if (pasteSuccess) {
        console.log('Paste operation likely successful');
        return true;
      } else {
        console.log('Paste operation likely failed - will show toast');
        return false;
      }
    } catch (error) {
      console.error('Error in copy/paste operation:', error);
      return false;
    }
  }

  /**
   * Attempt to paste using synthetic Ctrl+V
   * Returns true if likely successful, false if should show toast
   */
  private async attemptPaste(): Promise<boolean> {
    try {
      // Store current clipboard content to verify if paste worked
      const originalClipboard = clipboard.readText();

      // Small delay to ensure focus is stable
      await this.sleep(50);

      // Simulate Ctrl+V
      robot.keyTap('v', ['control']);
      console.log('Sent Ctrl+V keystroke');

      // Wait for the paste operation to complete
      await this.sleep(150);

      // Heuristic approach to detect paste success
      const success = await this.detectPasteSuccess(originalClipboard);
      
      if (success) {
        console.log('✅ Paste operation likely successful');
        return true;
      } else {
        console.log('❌ Paste operation likely failed');
        return false;
      }

    } catch (error) {
      console.error('Error during paste attempt:', error);
      return false;
    }
  }

  /**
   * Detect if paste was likely successful using multiple heuristics
   */
  private async detectPasteSuccess(originalText: string): Promise<boolean> {
    try {
      // Check 1: Clipboard content should remain unchanged after successful paste
      const currentClipboard = clipboard.readText();
      if (currentClipboard !== originalText) {
        console.log('Clipboard changed unexpectedly');
        return false;
      }

      // Check 2: Look for known problematic applications
      const focusedApp = this.getFocusedApplicationName();
      const problematicApps = ['elevated', 'admin', 'system', 'uac'];
      const isPotentiallyProblematic = problematicApps.some(app => 
        focusedApp.toLowerCase().includes(app)
      );

      if (isPotentiallyProblematic) {
        console.log('Detected potentially problematic application for pasting');
        return false;
      }

      // Check 3: For most standard applications, assume success if no obvious failures
      // In a production app, we might use Win32 APIs like GetGUIThreadInfo to
      // detect if the focused control accepts text input
      
      return true; // Assume success for most cases

    } catch (error) {
      console.error('Error detecting paste success:', error);
      return false;
    }
  }

  /**
   * Get the name of the currently focused application
   * This is a simplified version - a real implementation would use Win32 APIs
   */
  private getFocusedApplicationName(): string {
    try {
      // This is a placeholder. In a real implementation, we would use
      // Windows APIs to get the focused window information
      return 'unknown';
    } catch (error) {
      console.error('Error getting focused application:', error);
      return 'unknown';
    }
  }

  /**
   * Simple async sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verify if clipboard operation succeeded by comparing content
   */
  public verifyClipboardContent(expectedText: string): boolean {
    try {
      const actualText = clipboard.readText();
      return actualText === expectedText;
    } catch (error) {
      console.error('Error verifying clipboard content:', error);
      return false;
    }
  }

  /**
   * Get current clipboard text
   */
  public getClipboardText(): string {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error('Error reading clipboard:', error);
      return '';
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
} 