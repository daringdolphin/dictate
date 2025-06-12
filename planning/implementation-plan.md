# Implementation Plan

## 1 – Project Bootstrap & Tooling
- [ ] Step 1: Initialise repository & configs
  - **Task**: Create baseline Node/Electron/React TypeScript workspace.
  - **Files**:
    - `/package.json`: declare `electron`, `react`, `webpack`, `typescript`,
      `@types/node`, `jest`, `playwright`, `robotjs`, etc.
    - `/tsconfig.json`: common compiler options.
    - `/electron-builder.json`: portable ZIP target.
    - `/webpack.main.config.js`: minimal main bundle.
    - `/webpack.renderer.config.js`: minimal renderer bundle with React.
    - `.gitignore`, `README.md`
  - **Step Dependencies**: none
  - **User Instructions**: Run `npm install` once generated.

- [ ] Step 2: Base Electron entry
  - **Task**: Add minimal `src/main/main.ts` that creates the
    `BrowserWindow` for future Overlay, listens for `app.whenReady`,
    and quits on all windows closed (placeholder only).
  - **Files**:
    - `src/main/main.ts`: new file.
  - **Step Dependencies**: Step 1

## 2 – IPC & Shared Types
- [ ] Step 3: Define shared IPC channels & strict types
  - **Task**: Create `src/common/types.ts` and `src/common/ipcChannels.ts`
    per spec; export Zod-validated message schemas.
  - **Files**:
    - `src/common/types.ts`
    - `src/common/ipcChannels.ts`
  - **Step Dependencies**: Step 2

## 3 – Main Process Core
- [ ] Step 4: System tray & runtime settings scaffold
  - **Task**: Add `tray.ts`, `history.ts`, `clipboard.ts`
    skeletons plus default in-RAM settings object.
  - **Files**:
    - `src/main/tray.ts`
    - `src/main/history.ts`
    - `src/main/clipboard.ts`
  - **Step Dependencies**: Step 3

- [ ] Step 5: Global shortcut registration
  - **Task**: Implement `shortcut.ts` to register
    `Ctrl+Shift+Space`, emit start/stop events to `main.ts`.
  - **Files**:
    - `src/main/shortcut.ts`
    - `src/main/main.ts`: wire in shortcut start/stop handlers.
  - **Step Dependencies**: Step 4
  - **User Instructions**: Hold down shortcut to verify console logs.

## 4 – Recorder Window & Audio Capture
- [ ] Step 6: Hidden Recorder window bootstrap
  - **Task**: Add minimal renderer at `/src/renderer/recorder/index.ts`
    that requests mic permission and logs success; `main.ts` spawns
    hidden window on shortcut down.
  - **Files**:
    - `src/renderer/recorder/index.ts`
    - `src/main/main.ts`: spawn code.
  - **Step Dependencies**: Step 5

- [ ] Step 7: AudioWorklet PCM pipeline
  - **Task**: Implement `audioWorkletProcessor.ts` and wire
    `postMessage` of 20 ms Int16 chunks via IPC `audio-chunk`.
  - **Files**:
    - `src/renderer/recorder/audioWorkletProcessor.ts`
    - `src/renderer/recorder/index.ts`: attach worklet & forward IPC.
    - `src/common/ipcChannels.ts`: ensure `audioChunk`.
    - `src/main/main.ts`: log chunk lengths.
  - **Step Dependencies**: Step 6

## 5 – Realtime Transcriber
- [ ] Step 8: RealtimeTranscriber class skeleton
  - **Task**: Add `src/main/realtimeTranscriber.ts` with
    `start/append/stop` stubs, internal buffer, and todo comments.
  - **Files**:
    - `src/main/realtimeTranscriber.ts`
  - **Step Dependencies**: Step 7

- [ ] Step 9: Implement OpenAI session creation & WS wiring
  - **Task**: Finish `start()` to `POST /v1/realtime/transcription_sessions`
    using `node-fetch`, open WebSocket, send `transcription_session.update`
    message. Read `OPENAI_API_KEY` env var.
  - **Files**:
    - `src/main/realtimeTranscriber.ts`
  - **Step Dependencies**: Step 8
  - **User Instructions**: Ensure `OPENAI_API_KEY` is set before running.

- [ ] Step 10: Stream chunks & back-pressure
  - **Task**: Implement `append()` sending
    `input_audio_buffer.append`, pausing IPC when
    `socket.bufferedAmount` exceeds 256 KiB.
  - **Files**:
    - `src/main/realtimeTranscriber.ts`
    - `src/main/main.ts`: pause/resume handling.
  - **Step Dependencies**: Step 9

- [ ] Step 11: Stop & final transcript handling
  - **Task**: Complete `stop()` to close socket, await
    `transcript.text.done`, resolve value, or fall back to
    `legacyWhisper.upload()`.
  - **Files**:
    - `src/main/realtimeTranscriber.ts`
    - `src/main/legacyWhisper.ts`: upload via Whisper REST (new file).
  - **Step Dependencies**: Step 10

## 6 – Overlay UI
- [ ] Step 12: Overlay window bootstrap
  - **Task**: Create React entry `/src/renderer/overlay/overlay.tsx`
    rendering “Recording…” placeholder; `main.ts` shows on shortcut down.
  - **Files**:
    - `src/renderer/overlay/index.html`
    - `src/renderer/overlay/overlay.tsx`
    - `src/main/main.ts`
  - **Step Dependencies**: Step 6

- [ ] Step 13: WaveformCanvas + Timer components
  - **Task**: Add components under `overlay/components`; feed dummy data.
  - **Files**:
    - `src/renderer/overlay/components/WaveformCanvas.tsx`
    - `src/renderer/overlay/components/TimerLabel.tsx`
    - `src/renderer/overlay/overlay.tsx`
  - **Step Dependencies**: Step 12

- [ ] Step 14: Bind live timer and draft transcript IPC
  - **Task**: Listen to `transcript-partial` from main and update UI;
    show spinner on transcribing state; fade-out after `done`.
  - **Files**:
    - `src/renderer/overlay/overlay.tsx`
    - `src/common/ipcChannels.ts`: ensure partial/final channels.
    - `src/main/main.ts`: forward WS delta/done to overlay.
  - **Step Dependencies**: Step 13

## 7 – Clipboard & Paste
- [ ] Step 15: Clipboard copy & robotjs paste
  - **Task**: Implement `clipboard.ts` per spec: write text,
    attempt synthetic Ctrl+V if editable control likely,
    verify success after 100 ms.
  - **Files**:
    - `src/main/clipboard.ts`
    - `src/main/main.ts`: invoke after final transcript.
  - **Step Dependencies**: Step 11

- [ ] Step 16: Overlay toast on paste failure
  - **Task**: Add `Toast` component; on failure send IPC to overlay to
    show “Copied to clipboard”.
  - **Files**:
    - `src/renderer/overlay/components/Toast.tsx`
    - `src/renderer/overlay/overlay.tsx`
    - `src/common/ipcChannels.ts`: toast channel.
    - `src/main/main.ts`
  - **Step Dependencies**: Step 15

## 8 – Transcript History & Tray Enhancements
- [ ] Step 17: RAM circular buffer implementation
  - **Task**: Complete `history.ts` with push & list methods.
  - **Files**:
    - `src/main/history.ts`
  - **Step Dependencies**: Step 15

- [ ] Step 18: Tray “Recent (n)” dynamic menu
  - **Task**: Update `tray.ts` to rebuild context menu when history
    changes; clicking item copies text to clipboard.
  - **Files**:
    - `src/main/tray.ts`
    - `src/main/main.ts`
  - **Step Dependencies**: Step 17

## 9 – Settings Window
- [ ] Step 19: Settings renderer bootstrap
  - **Task**: Add React window `/src/renderer/settings/settings.tsx`
    with HotkeyField and ToggleSwitch components (placeholder).
  - **Files**:
    - `src/renderer/settings/index.html`
    - `src/renderer/settings/settings.tsx`
  - **Step Dependencies**: Step 12

- [ ] Step 20: Hotkey re-binding flow
  - **Task**: Implement HotkeyField capture, send `settingsUpdated`
    IPC; main updates shortcut registration live.
  - **Files**:
    - `src/renderer/settings/components/HotkeyField.tsx`
    - `src/common/ipcChannels.ts`: settingsUpdated
    - `src/main/shortcut.ts`: dynamic update
    - `src/renderer/settings/settings.tsx`
  - **Step Dependencies**: Step 19

- [ ] Step 21: Toast toggle & about tab
  - **Task**: Add ToggleSwitch for “Show toast”, simple About info with
    Whisper cost note.
  - **Files**:
    - `src/renderer/settings/components/ToggleSwitch.tsx`
    - `src/renderer/settings/settings.tsx`
    - `src/main/main.ts`: read setting when deciding to show toast.
  - **Step Dependencies**: Step 20

## 10 – Cancellation & Error Handling
- [ ] Step 22: Esc cancel during recording
  - **Task**: Register temporary global Esc shortcut, stop recording,
    hide overlay, do NOT copy/paste.
  - **Files**:
    - `src/main/shortcut.ts`
    - `src/main/main.ts`
    - `src/renderer/overlay/overlay.tsx`: show “Cancelled”.
  - **Step Dependencies**: Step 14

- [ ] Step 23: Mic permission & WS failure UI
  - **Task**: Detect mic denial, WS close ≠1000; show error overlay
    state and tray icon.
  - **Files**:
    - `src/renderer/overlay/overlay.tsx`
    - `src/main/main.ts`
    - `src/assets/icons/error.png` (add)
  - **Step Dependencies**: Step 14

## 11 – Testing
- [ ] Step 24: Unit tests – RealtimeTranscriber
  - **Task**: Use Jest w/ mock WS server to assert messages, timeout,
    fallback logic.
  - **Files**:
    - `tests/realtimeTranscriber.test.ts`
  - **Step Dependencies**: Step 11

- [ ] Step 25: Unit tests – Clipboard logic
  - **Task**: Mock `robotjs`, verify paste success/failure branches.
  - **Files**:
    - `tests/clipboard.test.ts`
  - **Step Dependencies**: Step 15

- [ ] Step 26: End-to-End Playwright tests
  - **Task**: Script Notepad scenario and network-failure scenario.
  - **Files**:
    - `tests/e2e/notepad.spec.ts`
  - **Step Dependencies**: Step 18
  - **User Instructions**: Enable a virtual audio loopback or feed
    prerecorded PCM via `sndfile-convert` for deterministic input.

## 12 – Build & Documentation
- [ ] Step 27: electron-builder packaging script
  - **Task**: Fill `electron-builder.json` targets, icon paths, files
    patterns; add `npm run dist`.
  - **Files**:
    - `/electron-builder.json`
    - `/package.json`: add scripts.
  - **Step Dependencies**: Step 18

- [ ] Step 28: Final README & usage guide
  - **Task**: Document setup, environment variable, hotkey, troubleshooting.
  - **Files**:
    - `README.md`
  - **Step Dependencies**: Step 27