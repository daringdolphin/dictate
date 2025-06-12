Project Name
VoiceClip
Project Description
VoiceClip is a minimal Windows desktop app (Electron) that stays in the system
tray. When the user holds a configurable global hot-key, it records speech,
shows a tiny on-screen overlay with waveform and timer, sends the audio to the
OpenAI Whisper API (English only), and on release it immediately

copies the transcript to the clipboard and
pastes it into the currently focused text field (if any); otherwise it
shows a brief toast that the text is on the clipboard.
Target Audience
Windows power users (e.g., engineers) who want friction-free voice-to-text
anywhere.
Desired FeaturesCore Functionality
 Global push-to-talk hot-key

 User-configurable shortcut


 Audio capture from default microphone
 Transcription via Whisper API

 English only
 Reads API key from environment variable OPENAI_API_KEY


 Clipboard & paste handling

 Always copy transcript to clipboard
 Simulate Ctrl + V into active window if editable control detected
 If paste likely failed, show toast “Copied to clipboard”


 Overlay feedback

 Fixed position: bottom-right of primary monitor
 Translucent circular overlay with waveform + live timer while
recording
 Changes to “Transcribing…” spinner after key release
 Auto-fades 0.5 s after transcript is pasted / toast shown
 Hidden at all other times


 RAM-only transcript history (cleared on app exit)

 Accessible via tray menu “Recent (n)”


User Interface
 System tray icon only while idle

 Icon indicates idle / recording / transcribing / error states


 Settings dialog

 Hot-key configuration
 Toggle toast notifications
 About page showing Whisper cost note


Performance & Quality
 Target end-to-end latency < 2 s for a 10-s clip
 Cancel recording with Esc (does not send audio)
 Wait for final Whisper result (no partial streaming in MVP)
Security & Privacy
 No audio or text stored on disk
 Only environment variable config stored; no user speech persisted
Deployment & Maintenance
 Windows portable ZIP build

 Unzip & run VoiceClip.exe
 Manual updates (replace folder)
 No installer, no code signing, no auto-update


Design Requests
 Minimal Windows-11-style visuals

 Light/dark theme following system
 Subtle translucent overlay animation


Other Notes
Whisper API cost: $0.006 /min; no enforced recording limit
MVP scope deliberately narrow; additional languages or offline mode are out
of scope for now
Potential Technical Challenges / Important Decisions
Foreground-control detection for auto-paste: Windows provides no reliable
API to know if the focused element accepts text. Heuristic approach:

Simulate Ctrl + V; if clipboard text appears to change or a WM_PASTE
isn’t processed (possible to monitor via GetLastError ≤ Win32 API),
fall back to leaving text on clipboard and showing a toast.
Edge cases include custom OpenGL/DirectX apps, elevated-privilege windows,
and UWP text controls.


Ensuring overlay is truly click-through / non-focus-stealing while retaining
timer and animation (use layered, transparent window with
WS_EX_TOOLWINDOW | WS_EX_TRANSPARENT flags via Electron’s BrowserWindow
options).
Latency: network variability plus Whisper processing time; may need local
buffering and back-pressure to avoid recording gap when key is rapidly
pressed again.
Microphone permission prompts vary by Windows build; the app must surface a
clear error if access is denied.
Reading OPENAI_API_KEY from environment in a packaged Electron app requires
forwarding the variable through the start script or editing the user’s
System Environment Variables.