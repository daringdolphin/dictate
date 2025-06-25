import { clipboard } from 'electron';
import * as robot from 'robotjs';
import { execSync } from 'child_process';

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
      // Ensure focused control is editable before pasting
      if (!this.isFocusedControlEditable()) {
        console.log('Focused control is not editable; skipping paste');
        return false;
      }

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

      // Check 2: Ensure focused control is editable
      if (!this.isFocusedControlEditable()) {
        console.log('Focused control no longer editable during paste check');
        return false;
      }

      // Assume success if clipboard unchanged and control editable
      return true;

    } catch (error) {
      console.error('Error detecting paste success:', error);
      return false;
    }
  }

  /**
   * Get the class name of the currently focused control using Win32 APIs
   */
  private getFocusedApplicationName(): string {
    try {
      const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr pid);
  [DllImport("user32.dll")] public static extern bool GetGUIThreadInfo(uint idThread, out GUITHREADINFO info);
  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder className, int maxCount);
}
[StructLayout(LayoutKind.Sequential)]
public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
[StructLayout(LayoutKind.Sequential)]
public struct GUITHREADINFO {
  public int cbSize;
  public int flags;
  public IntPtr hwndActive;
  public IntPtr hwndFocus;
  public IntPtr hwndCapture;
  public IntPtr hwndMenuOwner;
  public IntPtr hwndMoveSize;
  public IntPtr hwndCaret;
  public RECT rcCaret;
}
"@
$hwnd = [Win32]::GetForegroundWindow()
$tid = [Win32]::GetWindowThreadProcessId($hwnd, [IntPtr]::Zero)
$info = New-Object GUITHREADINFO
$info.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($info)
[Win32]::GetGUIThreadInfo($tid, [ref]$info) | Out-Null
$focus = $info.hwndFocus
if($focus -eq [IntPtr]::Zero){ return }
$class = New-Object System.Text.StringBuilder 128
[Win32]::GetClassName($focus, $class, $class.Capacity) | Out-Null
$class.ToString()
`;

      const encoded = Buffer.from(ps, 'utf16le').toString('base64');
      const result = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, { encoding: 'utf8' });
      const className = result.trim();
      return className || 'unknown';
    } catch (error) {
      console.error('Error getting focused application:', error);
      return 'unknown';
    }
  }

  /**
   * Determine if the currently focused control is likely editable
   */
  private isFocusedControlEditable(): boolean {
    const className = this.getFocusedApplicationName().toLowerCase();
    const editable = ['edit', 'richedit', 'textbox'];
    return editable.some(c => className.includes(c));
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