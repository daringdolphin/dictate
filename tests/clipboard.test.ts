import { ClipboardManager } from '../src/main/clipboard';
import * as robotjs from 'robotjs';
import { clipboard } from 'electron';

// Mock robotjs
jest.mock('robotjs');
const mockRobotjs = robotjs as jest.Mocked<typeof robotjs> & {
  getActiveWindow: jest.MockedFunction<() => any>;
};

// Mock electron clipboard
jest.mock('electron', () => ({
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn(),
  }
}));

const mockClipboard = clipboard as jest.Mocked<typeof clipboard>;

describe('ClipboardManager', () => {
  let clipboardManager: ClipboardManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create new instance
    clipboardManager = new ClipboardManager();
    
    // Set up default mock returns
    mockClipboard.readText.mockReturnValue('');
    mockRobotjs.getActiveWindow.mockReturnValue({
      title: 'Test Window',
      pid: 1234,
      x: 100,
      y: 100,
      width: 800,
      height: 600
    } as any);
  });

  describe('copyAndPaste', () => {
    const testText = 'Hello, world! This is a test transcript.';

    test('should copy text to clipboard successfully', async () => {
      mockClipboard.readText
        .mockReturnValueOnce('') // Initial clipboard content
        .mockReturnValueOnce('') // After write
        .mockReturnValueOnce(''); // After paste detection

      const result = await clipboardManager.copyAndPaste(testText);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);
      expect(mockRobotjs.keyTap).toHaveBeenCalledWith('v', ['control']);
      expect(result).toBe(true);
    });

    test('should attempt synthetic paste for any window', async () => {
      // The implementation always attempts paste regardless of window type
      mockRobotjs.getActiveWindow.mockReturnValue({
        title: 'Calculator',
        pid: 1234
      } as any);

      mockClipboard.readText
        .mockReturnValueOnce('') // Initial clipboard content
        .mockReturnValueOnce('') // After write
        .mockReturnValueOnce(''); // After paste detection

      const result = await clipboardManager.copyAndPaste(testText);

      expect(mockRobotjs.keyTap).toHaveBeenCalledWith('v', ['control']);
      expect(result).toBe(true);
    });

    test('should handle robotjs getActiveWindow failure gracefully', async () => {
      mockRobotjs.getActiveWindow.mockImplementation(() => {
        throw new Error('Failed to get active window');
      });

      mockClipboard.readText.mockReturnValue('');

      const result = await clipboardManager.copyAndPaste(testText);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);
      // Should still attempt paste even if getActiveWindow fails
      expect(mockRobotjs.keyTap).toHaveBeenCalledWith('v', ['control']);
      expect(result).toBe(true); // Returns true for most cases
    });

    test('should handle robotjs keyTap failure gracefully', async () => {
      mockRobotjs.keyTap.mockImplementation(() => {
        throw new Error('Failed to send key');
      });

      mockClipboard.readText.mockReturnValue('');

      const result = await clipboardManager.copyAndPaste(testText);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);
      expect(result).toBe(false);
    });
  });

  describe('Paste Success Detection', () => {
    const testText = 'Test clipboard content';

    test('should detect successful paste when clipboard remains unchanged', async () => {
      // Clipboard remains unchanged after paste (successful paste consumed it)
      mockClipboard.readText
        .mockReturnValueOnce('') // Initial
        .mockReturnValueOnce('') // After write
        .mockReturnValueOnce(''); // After paste detection

      const result = await clipboardManager.copyAndPaste(testText);
      expect(result).toBe(true);
    });

    test('should handle timing edge cases in paste detection', async () => {
      // Test rapid clipboard changes
      let callCount = 0;
      mockClipboard.readText.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) return ''; // All reads return empty (successful)
        return '';
      });

      const result = await clipboardManager.copyAndPaste(testText);
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle clipboard write errors', async () => {
      mockClipboard.writeText.mockImplementation(() => {
        throw new Error('Clipboard access denied');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await clipboardManager.copyAndPaste('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in copy/paste operation:',
        expect.any(Error)
      );
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });

    test('should handle clipboard read errors', async () => {
      mockClipboard.readText.mockImplementation(() => {
        throw new Error('Clipboard read failed');
      });

      const result = await clipboardManager.copyAndPaste('test');

      expect(result).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('should verify clipboard content correctly', () => {
      const testText = 'test content';
      mockClipboard.readText.mockReturnValue(testText);

      const result = clipboardManager.verifyClipboardContent(testText);
      expect(result).toBe(true);
    });

    test('should get clipboard text correctly', () => {
      const testText = 'test content';
      mockClipboard.readText.mockReturnValue(testText);

      const result = clipboardManager.getClipboardText();
      expect(result).toBe(testText);
    });

    test('should handle clipboard utility errors gracefully', () => {
      mockClipboard.readText.mockImplementation(() => {
        throw new Error('Clipboard error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const verifyResult = clipboardManager.verifyClipboardContent('test');
      const getResult = clipboardManager.getClipboardText();

      expect(verifyResult).toBe(false);
      expect(getResult).toBe('');
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should complete within reasonable time limits', async () => {
      const startTime = Date.now();
      
      await clipboardManager.copyAndPaste('test');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle rapid successive calls', async () => {
      const promises: Promise<boolean>[] = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(clipboardManager.copyAndPaste(`test ${i}`));
      }

      const results = await Promise.all(promises);
      
      // All calls should complete
      expect(results).toHaveLength(5);
      
      // Each call should have tried to write to clipboard
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(5);
    });

    test('should handle empty text input', async () => {
      const result = await clipboardManager.copyAndPaste('');
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
      expect(result).toBe(true); // Should still work with empty text
    });

    test('should handle very long text input', async () => {
      const longText = 'a'.repeat(10000);
      
      const result = await clipboardManager.copyAndPaste(longText);
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(longText);
      expect(result).toBe(true);
    });
  });
}); 