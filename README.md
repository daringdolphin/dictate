# VoiceClip

A minimal Windows desktop app for push-to-talk voice-to-text transcription using OpenAI's Whisper API.

## Overview

VoiceClip provides friction-free voice-to-text functionality for Windows power users. Simply hold a global hotkey, speak into your microphone, and release to get instant transcription that's automatically copied to your clipboard and pasted into the active text field.

## Features

- **Global Push-to-Talk**: Configurable hotkey (default: `Ctrl+Shift+Space`)
- **Real-time Transcription**: Uses OpenAI's Whisper API with streaming support
- **Smart Paste**: Automatically pastes transcription into focused text fields
- **Overlay Feedback**: Minimal translucent overlay with waveform and timer
- **System Tray Integration**: Unobtrusive tray icon with status indicators
- **Transcript History**: Access recent transcriptions from the tray menu
- **Configurable Settings**: Customize hotkeys and notification preferences
- **Privacy First**: No audio or transcripts stored on disk

## Requirements

- **Windows 10/11** (x64 or x86)
- **Node.js 18+** (for development)
- **OpenAI API Key** with Whisper API access
- **Microphone access** (will prompt for permission)

## Installation

### Option 1: Download Pre-built Release (Recommended)

1. Download the latest `VoiceClip-{version}-portable.exe` from the releases page
2. Extract to a folder of your choice (e.g., `C:\Program Files\VoiceClip\`)
3. Set your OpenAI API key (see [Environment Setup](#environment-setup))
4. Run `VoiceClip.exe`

### Option 2: Build from Source

1. Clone this repository:
   ```bash
   git clone https://github.com/your-org/voiceclip.git
   cd voiceclip
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set your OpenAI API key (see [Environment Setup](#environment-setup))

4. Build and run:
   ```bash
   pnpm start
   ```

## Environment Setup

VoiceClip requires an OpenAI API key to function. You can set this in several ways:

### Method 1: System Environment Variable (Recommended)

1. Open **System Properties** → **Advanced** → **Environment Variables**
2. Under **User variables**, click **New**
3. Set:
   - **Variable name**: `OPENAI_API_KEY`
   - **Variable value**: `your_api_key_here`
4. Click **OK** and restart VoiceClip

### Method 2: Command Line

```cmd
set OPENAI_API_KEY=your_api_key_here
VoiceClip.exe
```

### Method 3: PowerShell

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
.\VoiceClip.exe
```

### Getting an OpenAI API Key

1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** in your dashboard
4. Click **Create new secret key**
5. Copy the key and use it in your environment setup

## Usage

### Basic Operation

1. **Start Recording**: Press and hold `Ctrl+Shift+Space` (or your configured hotkey)
2. **Speak**: A small overlay will appear showing recording status and waveform
3. **Stop Recording**: Release the hotkey
4. **Get Results**: The overlay shows "Transcribing..." then fades away
5. **Auto-Paste**: Text is automatically pasted into the focused text field
6. **Fallback**: If paste fails, text remains on clipboard with a toast notification

### Hotkey Configuration

1. Right-click the VoiceClip tray icon
2. Select **Settings**
3. In the **General** tab, click the hotkey field
4. Press your desired key combination
5. Click **Save**

**Supported Modifiers**: `Ctrl`, `Shift`, `Alt`, `Win`
**Supported Keys**: Letters, numbers, function keys, space

### Accessing Transcript History

1. Right-click the VoiceClip tray icon
2. Select **Recent (n)** where n is the number of recent transcripts
3. Click any transcript to copy it to the clipboard

### Canceling Recording

- Press `Esc` while recording to cancel without transcribing
- The overlay will disappear and no text will be copied

### System Tray Icons

- 🔵 **Blue**: Idle, ready for input
- 🔴 **Red**: Recording in progress  
- 🟡 **Yellow**: Transcribing audio
- ❌ **Red X**: Error state (check API key or microphone)

## Settings

Access settings by right-clicking the tray icon and selecting **Settings**.

### General Tab

- **Global Hotkey**: Configure your push-to-talk key combination
- **Show Toast Notifications**: Toggle clipboard fallback notifications

### About Tab

- Version information
- Whisper API cost information ($0.006 per minute)
- Links to documentation and support

## Troubleshooting

### "No API Key Found"

**Cause**: OpenAI API key not set or not accessible to VoiceClip
**Solution**: 
1. Verify your API key is correctly set in environment variables
2. Restart VoiceClip after setting the environment variable
3. Try running from Command Prompt with `set OPENAI_API_KEY=your_key`

### "Microphone Access Denied"

**Cause**: Windows has blocked microphone access for VoiceClip
**Solution**:
1. Go to **Windows Settings** → **Privacy & Security** → **Microphone**
2. Ensure "Microphone access" is **On**
3. Ensure "Let apps access your microphone" is **On**
4. Restart VoiceClip

### "Recording Not Starting"

**Cause**: Hotkey conflict or registration failure
**Solution**:
1. Try changing the hotkey in Settings
2. Close other apps that might use the same hotkey
3. Run VoiceClip as Administrator (temporarily for testing)

### "Transcription Not Appearing"

**Cause**: API error, network issues, or paste failure
**Solution**:
1. Check your internet connection
2. Verify your OpenAI API key has Whisper access
3. Check if text was copied to clipboard manually
4. Try speaking more clearly and for longer duration

### "Auto-Paste Not Working"

**Cause**: Target application doesn't support synthetic input or focus detection failed
**Solution**:
1. Enable "Show Toast Notifications" in Settings
2. Use `Ctrl+V` manually when toast appears
3. Some apps (games, admin windows) block synthetic input - this is normal

### Performance Issues

**Cause**: Network latency or audio processing delays
**Solution**:
1. Use a stable internet connection
2. Keep recordings under 30 seconds for best performance
3. Check Windows audio settings for correct default microphone

### High API Costs

**Cause**: Frequent or long recordings
**Solution**:
1. Be mindful that Whisper charges $0.006 per minute
2. Keep recordings concise
3. Use the cancel feature (Esc) if you make mistakes

## Development

### Building

```bash
# Development build
pnpm run build

# Development mode with auto-reload
pnpm run dev

# Production distribution
pnpm run dist

# Portable executable only
pnpm run dist:portable

# ZIP archive only  
pnpm run dist:zip
```

### Testing

```bash
# Unit tests
pnpm run test:unit

# End-to-end tests
pnpm run test:e2e

# All tests
pnpm run test:all

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage
```

### Project Structure

```
voiceclip/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React UI components
│   └── common/         # Shared types and utilities
├── assets/             # Icons and resources
├── tests/              # Test files
├── planning/           # Project documentation
└── dist/               # Built application
```

## Technical Details

- **Framework**: Electron with TypeScript
- **UI**: React with modern CSS
- **Audio**: Web Audio API with AudioWorklet
- **Transcription**: OpenAI Whisper API (realtime streaming)
- **Packaging**: electron-builder (portable Windows executable)

## Privacy & Security

- **No Persistent Storage**: Audio and transcripts are never saved to disk
- **Memory Only**: Transcript history cleared on app exit  
- **Local Processing**: Only final audio sent to OpenAI (no streaming to third parties)
- **API Key Security**: Stored in environment variables only

## Cost Information

VoiceClip uses OpenAI's Whisper API which charges **$0.006 per minute** of audio transcribed. A typical 10-second voice clip costs approximately $0.001.

## Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: See `/planning/` directory for technical specifications
- **Community**: Join discussions in GitHub Discussions

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- OpenAI for the Whisper API
- Electron community for the framework
- Contributors and testers 