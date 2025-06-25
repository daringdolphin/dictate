import { RealtimeTranscriber } from '../src/main/realtimeTranscriber';
import WebSocket from 'ws';
import fetch from 'node-fetch';

// Mock dependencies
jest.mock('ws');
jest.mock('node-fetch');
jest.mock('../src/main/legacyWhisper');

const MockWebSocket = WebSocket as jest.MockedClass<typeof WebSocket>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a more complete mock WebSocket
class MockWebSocketInstance extends EventTarget {
  public readyState: number = WebSocket.CONNECTING;
  public url: string;
  public headers: any;
  public CONNECTING = WebSocket.CONNECTING;
  public OPEN = WebSocket.OPEN;
  public CLOSING = WebSocket.CLOSING;
  public CLOSED = WebSocket.CLOSED;

  constructor(url: string, options?: any) {
    super();
    this.url = url;
    this.headers = options?.headers || {};
    // Simulate immediate connection for tests
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 10);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent('close', { code: 1000 }));
  }

  send(data: any) {
    // Mock send - just store the data
  }

  // Add the 'on' method that the real WebSocket uses
  on(event: string, handler: Function) {
    this.addEventListener(event, handler as EventListener);
  }

  // Simulate receiving a message
  simulateMessage(data: any) {
    const messageEvent = new MessageEvent('message', {
      data: Buffer.from(JSON.stringify(data))
    });
    this.dispatchEvent(messageEvent);
  }
}

describe('RealtimeTranscriber', () => {
  let transcriber: RealtimeTranscriber;
  let mockWsInstance: MockWebSocketInstance;

  beforeEach(() => {
    // Reset environment
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup WebSocket mock
    mockWsInstance = new MockWebSocketInstance('ws://test');
    (MockWebSocket as any).mockImplementation(() => mockWsInstance);
    
    // Create new transcriber instance
    transcriber = new RealtimeTranscriber();
  });

  afterEach(() => {
    // Clean up
    if (transcriber.recording) {
      transcriber.cancel();
    }
  });

  describe('Initialization', () => {
    test('should create instance without starting recording', () => {
      expect(transcriber.recording).toBe(false);
      expect(transcriber.bufferSize).toBe(0);
    });

    test('should require OPENAI_API_KEY environment variable', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(transcriber.start()).rejects.toThrow(
        'OPENAI_API_KEY environment variable is required'
      );
    });
  });

  describe('Session Creation', () => {
    test('should create transcription session successfully', async () => {
      // Mock successful API response
      const mockSession = {
        id: 'session-123',
        client_secret: 'secret-456'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession
      } as any);

      await transcriber.start();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/realtime/transcription_sessions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: 'transcription'
          })
        }
      );

      expect(transcriber.recording).toBe(true);
    });

    test('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      } as any);

      await expect(transcriber.start()).rejects.toThrow(
        'Failed to create transcription session: 401 Unauthorized'
      );

      expect(transcriber.recording).toBe(false);
    });
  });

  describe('WebSocket Connection', () => {
    beforeEach(async () => {
      // Setup successful session creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'session-123',
          client_secret: 'secret-456'
        })
      } as any);
    });

    test('should establish WebSocket connection with correct headers', async () => {
      await transcriber.start();

      expect(MockWebSocket).toHaveBeenCalledWith(
        'wss://api.openai.com/v1/realtime?intent=transcription',
        {
          headers: {
            'Authorization': 'Bearer secret-456'
          }
        }
      );
    });

    test('should clear connection timeout on successful open', async () => {
      const realSetTimeout = global.setTimeout;
      const clearSpy = jest.spyOn(global, 'clearTimeout');
      let timeoutId: any;

      jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((fn, delay) => {
          if (delay === 10000) {
            timeoutId = realSetTimeout(fn as any, delay);
            return timeoutId as any;
          }
          return realSetTimeout(fn as any, delay) as any;
        });

      await transcriber.start();

      expect(clearSpy).toHaveBeenCalledWith(timeoutId);

      (global.setTimeout as any).mockRestore();
      clearSpy.mockRestore();
    });

    test('should handle WebSocket connection timeout', async () => {
      // Create a WebSocket that never connects
      const slowMockWs = new MockWebSocketInstance('ws://test');
      slowMockWs.readyState = WebSocket.CONNECTING;
      (MockWebSocket as any).mockImplementation(() => slowMockWs);

      // Don't auto-connect
      jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
        if (delay === 10000) { // Connection timeout
          setTimeout(() => (fn as Function)(), 50); // Trigger timeout quickly
        }
        return {} as any;
      });

      await expect(transcriber.start()).rejects.toThrow('WebSocket connection timeout');
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      // Setup successful connection
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'session-123',
          client_secret: 'secret-456'
        })
      } as any);

      await transcriber.start();
    });

    test('should handle transcript.text.delta messages', () => {
      const partialSpy = jest.fn();
      transcriber.on('transcript-partial', partialSpy);

      // Simulate receiving delta messages
      mockWsInstance.simulateMessage({
        type: 'transcript.text.delta',
        text: { delta: 'Hello ' }
      });

      mockWsInstance.simulateMessage({
        type: 'transcript.text.delta',
        text: { delta: 'world' }
      });

      expect(partialSpy).toHaveBeenCalledWith('Hello ');
      expect(partialSpy).toHaveBeenCalledWith('Hello world');
    });

    test('should handle transcript.text.done messages', () => {
      const finalSpy = jest.fn();
      transcriber.on('transcript-final', finalSpy);

      mockWsInstance.simulateMessage({
        type: 'transcript.text.done',
        text: { value: 'Complete transcript text' }
      });

      expect(finalSpy).toHaveBeenCalledWith('Complete transcript text');
    });

    test('should handle unknown message types gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockWsInstance.simulateMessage({
        type: 'unknown.message.type',
        data: 'some data'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled message type: unknown.message.type')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Audio Buffer Management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'session-123',
          client_secret: 'secret-456'
        })
      } as any);

      await transcriber.start();
    });

    test('should accept and buffer audio chunks', () => {
      const audioData = new ArrayBuffer(1024);
      
      transcriber.append(audioData);
      
      expect(transcriber.bufferSize).toBe(1);
    });

    test('should handle back-pressure when WebSocket buffer is full', () => {
      // Mock high buffered amount
      Object.defineProperty(mockWsInstance, 'bufferedAmount', {
        value: 300000, // > 256KB
        configurable: true
      });

      expect(transcriber.isBackPressured).toBe(true);
    });

    test('should not be back-pressured under normal conditions', () => {
      Object.defineProperty(mockWsInstance, 'bufferedAmount', {
        value: 1000, // < 256KB
        configurable: true
      });

      expect(transcriber.isBackPressured).toBe(false);
    });
  });

  describe('Stop and Cleanup', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'session-123',
          client_secret: 'secret-456'
        })
      } as any);

      await transcriber.start();
    });

    test('should wait for final transcript before closing WebSocket', async () => {
      const closeSpy = jest.spyOn(mockWsInstance, 'close');

      setTimeout(() => {
        expect(closeSpy).not.toHaveBeenCalled();
        transcriber.emit('transcript-final', 'Final transcript');
      }, 50);

      const stopPromise = transcriber.stop();

      await new Promise((r) => setTimeout(r, 20));
      expect(closeSpy).not.toHaveBeenCalled();

      const result = await stopPromise;

      expect(result).toBe('Final transcript');
      expect(closeSpy).toHaveBeenCalledWith(1000);
      expect(transcriber.recording).toBe(false);
    });

    test('should handle stop timeout and fallback to legacy Whisper', async () => {
      // Don't emit final transcript - should timeout
      jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
        if (delay === 30000) { // Stop timeout
          setTimeout(() => (fn as Function)(), 50); // Trigger timeout quickly
        }
        return {} as any;
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await transcriber.stop();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No final transcript received')
      );
      expect(result).toBe(''); // No fallback implemented in tests

      consoleSpy.mockRestore();
    });

    test('should cancel recording without waiting', () => {
      transcriber.cancel();

      expect(transcriber.recording).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should emit error on WebSocket failure', () => {
      const errorSpy = jest.fn();
      transcriber.on('error', errorSpy);

      const testError = new Error('WebSocket failed');
      mockWsInstance.dispatchEvent(new ErrorEvent('error', { error: testError }));

      expect(errorSpy).toHaveBeenCalledWith(testError);
    });

    test('should prevent concurrent recording sessions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'session-123', client_secret: 'secret-456' })
      } as any);

      await transcriber.start();

      await expect(transcriber.start()).rejects.toThrow('Already recording');
    });

    test('should handle malformed WebSocket messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate malformed message
      const invalidMessageEvent = new MessageEvent('message', {
        data: Buffer.from('invalid json')
      });
      mockWsInstance.dispatchEvent(invalidMessageEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    test('should track recording state correctly', async () => {
      expect(transcriber.recording).toBe(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'session-123', client_secret: 'secret-456' })
      } as any);

      await transcriber.start();
      expect(transcriber.recording).toBe(true);

      transcriber.cancel();
      expect(transcriber.recording).toBe(false);
    });

    test('should reset state between recordings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'session-123', client_secret: 'secret-456' })
      } as any);

      // First recording
      await transcriber.start();
      transcriber.append(new ArrayBuffer(512));
      expect(transcriber.bufferSize).toBe(1);
      
      transcriber.cancel();

      // Second recording should start fresh
      await transcriber.start();
      expect(transcriber.bufferSize).toBe(0);
    });
  });
}); 