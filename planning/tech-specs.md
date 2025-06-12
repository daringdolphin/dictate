```markdown
# VoiceClip Technical Specification

## 1. System Overview
- Core purpose  
  VoiceClip gives Windows power-users a zero-friction, push-to-talk,
  voice-to-text experience anywhere text can be entered.
- Key workflows  
  1. User holds a global hot-key  
  2. Microphone audio is streamed to OpenAI’s Realtime ASR API  
  3. On hot-key release, VoiceClip waits for the final
     `transcript.text.done` event  
  4. Transcript is copied to the clipboard and pasted into the focused
     editable control; otherwise a toast is shown  
  5. Overlay fades and the transcript is cached in RAM history
- High-level architecture  
  - Electron application, fully client-side  
    - Main Process (Node): privileged tasks  
      - Global shortcuts, system tray, clipboard, WebSocket session,
        in-memory history  
    - Recorder Window (hidden Renderer): captures PCM16 mic audio with an
      `AudioWorklet` and sends 20 ms chunks to Main via IPC  
    - Overlay Renderer (React): shows waveform / timer /
      “Transcribing…” spinner / optional live draft text  
    - Settings Renderer (React): config UI  
  - No persistent storage and no backend server; audio never touches disk

## 2. Project Structure
- `/package.json`, `/tsconfig.json`
- `/electron-builder.json` (portable ZIP build)
- `/src`
  - `/main`
    - `main.ts` – bootstrap  
    - `tray.ts`  
    - `shortcut.ts`  
    - `realtimeTranscriber.ts` ⟵ NEW  
    - `legacyWhisper.ts` (fallback)  
    - `clipboard.ts`  
    - `history.ts`  
    - `ipcChannels.ts`
  - `/renderer`
    - `/overlay`
      - `index.html`, `overlay.tsx`, components, `overlay.css`
    - `/recorder`
      - `index.ts`, `audioWorkletProcessor.ts`
    - `/settings`
      - `index.html`, `settings.tsx`, components
  - `/common`
    - `types.ts` – shared interfaces  
    - `wsMessages.ts` – zod schemas for WS messages  
    - `theme.ts`
- `/assets`
  - `icons/idle.png`, `icons/rec.png`, `icons/trans.png`, `icons/error.png`
- `/build`
  - `webpack.main.config.js`, `webpack.renderer.config.js`

## 3. Feature Specification

### 3.1 Global Push-to-Talk Hot-key
- User story  
  “As a user I want to hold a key (default \( \mathrm{Ctrl+Shift+Space} \))
  to dictate text anywhere.”
- Implementation  
  - Register with `globalShortcut.register()` at app start  
  - On key-down  
    - Ensure microphone permission  
    - Spawn hidden Recorder window  
    - `RealtimeTranscriber.start()`  
    - Open Overlay window in bottom-right corner  
  - On key-up  
    - Call `RealtimeTranscriber.stop()` → returns final transcript  
    - Proceed to Clipboard & Paste flow
- Edge cases & errors  
  - Shortcut already in use → tray balloon & fallback to default  
  - Key released before mic permission granted → cancel

### 3.2 Streaming Audio Capture
- Requirements  
  - 16 kHz, 16-bit PCM, mono  
  - Chunk size: 320 samples (20 ms, 640 B)  
  - Abort with Esc
- Step-by-step  
  1. Recorder window obtains mic stream  
  2. Create `AudioContext({ sampleRate: 16000 })`  
  3. Load `audioWorkletProcessor.js`:
     ```ts
     class PCMWorklet extends AudioWorkletProcessor {
       process(inputs) {
         const f32 = inputs[0][0];            // Float32 samples
         const i16 = new Int16Array(f32.length);
         for (let i = 0; i < f32.length; i++) {
           i16[i] = Math.max(-1, Math.min(1, f32[i])) * 0x7fff;
         }
         this.port.postMessage(i16.buffer, [i16.buffer]);
         return true;
       }
     }
     registerProcessor('pcm-worklet', PCMWorklet);
     ```
  4. Main listens to `audio-chunk` IPC and calls
     `RealtimeTranscriber.append(chunk)`
- Errors  
  - Mic permission denied → Overlay shows error, recording cancelled  
  - Buffer back-pressure (see RealtimeTranscriber)

### 3.3 Realtime Transcription
- User story  
  “I want the transcript ready immediately when I stop speaking.”
- Implementation
  - Class signature
    ```ts
    interface RealtimeTranscriber {
      start(): Promise<void>;
      append(buffer: ArrayBuffer): void;
      stop(): Promise<string>; // final transcript
    }
    ```
  - Session creation  
    - `POST /v1/realtime/transcription_sessions`
      ```json
      { "intent": "transcription" }
      ```
    - Receive `{ id, client_secret, expires_at }`
  - WebSocket `wss://api.openai.com/v1/realtime?intent=transcription`
    - Header `Authorization: Bearer <client_secret>`
    - First message `transcription_session.update`
      ```json
      {
        "type": "transcription_session.update",
        "input_audio_format": "pcm16",
        "input_audio_transcription": {
          "model": "gpt-4o-mini-transcribe",
          "language": "en"
        },
        "turn_detection": null
      }
      ```
  - While recording  
    - Send
      ```json
      {
        "type": "input_audio_buffer.append",
        "audio": "<Base64PCM>"
      }
      ```
    - If `socket.bufferedAmount > 262144`
      pause IPC until drained
  - On key-up  
    - Stop sending `append` messages, call `socket.close(1000)`
  - Listen for  
    - `transcript.text.delta` → forward to Overlay (draft)  
    - `transcript.text.done` → resolve final transcript
- Error handling & fallback  
  - Any non-1000 close, 5 s timeout, or first delta not received →
    destroy socket and invoke `legacyWhisper.upload(buffer)`  
  - Automatic token refresh on `401 Unauthorized`

### 3.4 Clipboard & Paste
- Requirements  
  - `clipboard.writeText(transcript)` always  
  - Attempt synthetic paste  
    - Detect editable control with native Win32 (`GetGUIThreadInfo`)  
    - If editable, use `robotjs.keyTap('v', 'control')`  
  - Verify success  
    - After 100 ms read clipboard; if unchanged or foreground window
      lost focus → assume paste failed → show toast
- Edge cases  
  - UAC elevated window blocks input  
  - RDP session where synthetic keystrokes are filtered

### 3.5 Overlay Feedback
- States  
  - recording → waveform + timer  
  - transcribing → spinner (+ optional draft text)  
  - done → fade-out (500 ms)  
- Layout  
  - 220 × 220 px circular, transparent, click-through  
  - CSS `backdrop-filter: blur(10px)`  
- Props interface
  ```ts
  interface OverlayProps {
    status: 'recording' | 'transcribing' | 'done';
    timerSec: number;
    draft?: string;
  }
  ```

### 3.6 Tray Icon & Menu
- Icons indicate `idle / recording / transcribing / error`
- Context menu  
  - Recent (n) – first 20 chars, click copies  
  - Settings…  
  - Quit
- Tooltip: “VoiceClip – {state}”

### 3.7 Settings Dialog
- Tabs  
  - General  
    - Hot-key recorder control  
    - Toggle “Show toast on failed paste”  
  - About  
    - Version, Whisper cost note
- Data flow  
  - Renderer sends `settings-updated` IPC with
    ```ts
    interface Settings { hotkey: string; toast: boolean }
    ```
  - Main updates runtime config (RAM only)

### 3.8 Transcript History (RAM)
- Circular buffer size 20
  ```ts
  interface Transcript {
    id: string;               // uuid
    text: string;
    ts: number;               // epoch ms
    durationSec: number;
  }
  ```

### 3.9 Cancel Recording
- Temporary global shortcut `Esc` registered only while recording  
- On press:  
  - Recorder stops immediately  
  - WebSocket closed with code 1000  
  - Overlay fades without calling Clipboard

## 4. Database Schema
VoiceClip stores nothing persistently. All runtime data reside in memory.
The following pseudo-table documents structure for history only.

### 4.1 Tables

TranscriptHistory (RAM only)
- id: string (UUID, PK)
- text: string
- ts: integer (epoch ms, index)
- duration_sec: integer

Relationships: none.  
Indexes: `[ts DESC]` for Recent list.

## 5. Server Actions

### 5.1 createTranscriptionSession
- Method: `POST /v1/realtime/transcription_sessions`
- Headers:  
  - `Authorization: Bearer \(OPENAI\_API\_KEY\)`
  - `Content-Type: application/json`
- Body: `{ "intent": "transcription" }`
- Returns: `{ id, client_secret, expires_at }`

### 5.2 WebSocket Interaction
- URL: `wss://api.openai.com/v1/realtime?intent=transcription`
- Authenticate with `Authorization: Bearer <client_secret>`
- Message contracts (TypeScript + zod)
  ```ts
  const TranscriptionSessionUpdate = z.object({
    type: z.literal('transcription_session.update'),
    input_audio_format: z.literal('pcm16'),
    input_audio_transcription: z.object({
      model: z.literal('gpt-4o-mini-transcribe'),
      language: z.literal('en')
    }),
    turn_detection: z.null()
  });

  const InputAudioBufferAppend = z.object({
    type: z.literal('input_audio_buffer.append'),
    audio: z.string() // Base64
  });
  ```
- Important server events  
  - `transcript.text.delta` `{ text: { delta: string } }`  
  - `transcript.text.done` `{ text: { value: string } }`

### 5.3 Legacy Whisper Upload (fallback)
- Endpoint: `POST /v1/audio/transcriptions`  
  - `model=whisper-1`, `language=en`, `response_format=text`

## 6. Design System

### 6.1 Visual Style
- Colors  
  - Primary Blue: `#3B82F6`  
  - Record Red: `#EF4444`  
  - Surface Glass Dark: `rgba(30,30,30,0.6)`  
  - Surface Glass Light: `rgba(255,255,255,0.6)` (auto for light mode)  
  - Text Light: `#FFFFFF`  
  - Text Dark: `#000000`
- Typography  
  - Font: Segoe UI Variable  
  - Size scale (px): 12, 14, 16, 20, 24  
  - Weight: 400 (regular), 600 (semibold)
- Spacing  
  - `s = 4 px`; use multiples of \( s \)
- Motion  
  - Overlay fade: 500 ms ease-out opacity  
  - Spinner rotation: 1 s linear infinite

### 6.2 Core Components
- `WaveformCanvas`  
  - props: `{ samples: Float32Array }`
- `TimerLabel`  
  - props: `{ seconds: number }`
- `Spinner`  
  - props: `{ size?: number }`
- `Toast`  
  - props: `{ message: string; type?: 'info' | 'error' }`
- `HotkeyField`  
  - props: `{ value: string; onChange(k: string) }`
- `ToggleSwitch`  
  - props: `{ checked: boolean; onChange(b: boolean) }`

## 7. Component Architecture

### 7.1 Main-Process Modules
- `realtimeTranscriber.ts`
  ```ts
  export class RealtimeTranscriber {
    async start(): Promise<void>;
    append(chunk: ArrayBuffer): void;
    async stop(): Promise<string>;
  }
  ```
- `ipcChannels.ts`
  ```ts
  export const IPC = {
    audioChunk: 'audio-chunk',             // ArrayBuffer
    transcriptPartial: 'transcript-partial', // string
    transcriptFinal: 'transcript-final',   // string
    settingsUpdated: 'settings-updated'
  } as const;
  ```

### 7.2 Renderer Components
- OverlayRoot.tsx
  ```tsx
  const OverlayRoot: FC<OverlayProps> = ({ status, timerSec, draft }) => {
    /* Renders WaveformCanvas, Spinner, draft text */
  };
  ```
- SettingsRoot.tsx
  ```tsx
  const SettingsRoot: FC = () => {
    const [hotkey, setHotkey] = useState('Ctrl+Shift+Space');
    const [toast, setToast] = useState(true);
    const save = () =>
      ipcRenderer.send(IPC.settingsUpdated, { hotkey, toast });
    /* ...UI... */
  };
  ```

## 8. Data Flow
1. Main registers global hot-key  
2. Key-down → Main creates Overlay & Recorder → `RealtimeTranscriber.start()`  
3. Recorder sends PCM chunks via `audio-chunk` IPC  
4. Main streams chunks over WebSocket  
5. WebSocket emits `transcript.text.delta` → Main → Overlay (`draft`)  
6. Key-up → `RealtimeTranscriber.stop()` → receives final text  
7. Main copies & pastes, updates history, notifies Overlay (`done`)  
8. Overlay fades; session returns to idle

## 9. Testing

### 9.1 Unit Tests (Jest)
- `realtimeTranscriber.test.ts`  
  - Mock `ws` server, assert correct JSON messages, back-pressure pause,
    timeout fallback
- `shortcut.test.ts`  
  - Register/unregister flows, collision detection
- `clipboard.test.ts`  
  - Paste success & toast fallback logic

### 9.2 End-to-End Tests (Playwright-Electron)
- Happy path  
  1. Launch VoiceClip  
  2. Focus Notepad  
  3. Hold hot-key 3 s (feed prerecorded mic PCM)  
  4. Release → expect Notepad contains “hello world” ≤ 500 ms
- Network failure mid-stream  
  - Drop WS connection → expect legacy upload fallback, paste ≤ 3 s
- Cancel with Esc  
  - Hold hot-key 2 s, press Esc before release → Overlay hides,
    nothing pasted, clipboard unchanged
```