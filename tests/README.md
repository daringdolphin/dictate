# VoiceClip Testing Suite

This directory contains comprehensive tests for the VoiceClip application, covering unit tests, integration tests, and end-to-end scenarios.

## Test Structure

```
tests/
├── setup.ts                 # Jest setup and global mocks
├── realtimeTranscriber.test.ts  # Unit tests for RealtimeTranscriber (Step 24)
├── clipboard.test.ts        # Unit tests for Clipboard logic (Step 25)
├── e2e/
│   └── notepad.spec.ts     # End-to-end Playwright tests (Step 26)
└── README.md               # This file
```

## Test Categories

### Unit Tests (Jest)

#### 🎤 RealtimeTranscriber Tests (`realtimeTranscriber.test.ts`)
**Covers Step 24 Requirements:**
- Mock WebSocket server implementation
- Message handling (delta, done, error)
- Session creation and WebSocket connection
- Timeout and fallback logic
- Audio buffer management
- Back-pressure handling
- Error scenarios and recovery

**Key Test Scenarios:**
- ✅ Session creation with OpenAI API
- ✅ WebSocket connection and message handling
- ✅ Audio chunk processing and Base64 conversion
- ✅ Transcript delta accumulation
- ✅ Final transcript retrieval
- ✅ Timeout handling and fallback to legacy Whisper
- ✅ Error handling for network failures
- ✅ State management and concurrent recording prevention

#### 📋 Clipboard Tests (`clipboard.test.ts`)
**Covers Step 25 Requirements:**
- Mock robotjs for synthetic key simulation
- Paste success/failure detection
- Window focus and editable control detection
- Error handling and edge cases

**Key Test Scenarios:**
- ✅ Clipboard write operations
- ✅ Editable window detection (Notepad, Word, VS Code, etc.)
- ✅ Non-editable window handling (Calculator, etc.)
- ✅ Synthetic Ctrl+V simulation
- ✅ Paste success verification
- ✅ Error handling (UAC, access denied, etc.)
- ✅ Performance and timing edge cases

### End-to-End Tests (Playwright)

#### 🖥️ Notepad Integration Tests (`e2e/notepad.spec.ts`)
**Covers Step 26 Requirements:**
- Real Notepad integration scenarios
- Network failure simulation
- Audio input simulation (with virtual loopback)

**Key Test Scenarios:**
- ✅ Complete recording → transcription → paste workflow
- ✅ Escape key cancellation
- ✅ Multiple rapid recordings
- ✅ OpenAI API connection failures
- ✅ WebSocket failure and fallback
- ✅ Microphone permission denial
- ✅ System tray interactions
- ✅ Different window types and focus handling
- ✅ Long recording sessions
- ✅ Memory and resource cleanup
- ✅ Performance under various conditions

## Running Tests

### Prerequisites

1. **Environment Setup:**
   ```bash
   # Install dependencies
   pnpm install
   
   # Set up test environment variable
   export OPENAI_API_KEY=test-api-key
   ```

2. **Audio Testing Setup (for E2E tests):**
   ```bash
   # For deterministic audio input, use sndfile-convert:
   # Windows: Download from https://github.com/libsndfile/libsndfile
   # Convert test audio: sndfile-convert input.wav -o output.wav -pcm16 -rate 16000
   ```

### Test Commands

```bash
# Run all unit tests
pnpm test:unit

# Run end-to-end tests
pnpm test:e2e

# Run all tests
pnpm test:all

# Run tests in watch mode (development)
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test realtimeTranscriber.test.ts
pnpm test clipboard.test.ts
```

### E2E Test Requirements

**For Notepad scenario testing:**
- Windows OS (for Notepad.exe)
- Virtual audio loopback device (optional, for deterministic input)
- Microphone access permissions
- Screen resolution ≥ 1920x1080 (for overlay positioning)

**Audio Setup Options:**
1. **Virtual Cable:** Use VB-Audio Virtual Cable for loopback
2. **Test Audio Files:** Pre-recorded PCM16 16kHz samples
3. **Mock Audio:** Simulated audio data for testing

## Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- Node environment for main process testing
- Electron mocking for UI components
- 10-second timeout for async operations
- Coverage collection from src/ directory

### Playwright Configuration (`playwright.config.ts`)
- Single worker for Electron app testing
- Sequential test execution (not parallel)
- Screenshot on failure
- Trace on first retry
- 30-second timeout for E2E scenarios

## Mock Implementations

### 🔌 WebSocket Mocking
- Custom MockWebSocket class simulating real WS behavior
- Message sending/receiving simulation
- Connection state management
- Error and close event simulation

### 🤖 RobotJS Mocking
- Window detection simulation
- Key press simulation
- Error scenario testing
- UAC and permission handling

### 🎵 Audio Source Mocking
- PCM audio generation
- Virtual loopback simulation
- Microphone permission scenarios

## Test Data and Fixtures

### Audio Test Files
- `test-audio.wav`: 3-second 16kHz PCM16 sample
- Generated programmatically during test setup
- Cleaned up automatically after tests

### Mock Responses
- OpenAI API session creation responses
- WebSocket message samples
- Transcript delta and final responses
- Error response simulations

## Debugging Tests

### Jest Tests
```bash
# Run with verbose output
pnpm test --verbose

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand realtimeTranscriber.test.ts
```

### Playwright Tests
```bash
# Run in headed mode (see browser)
pnpm test:e2e --headed

# Debug mode with pause
pnpm test:e2e --debug

# Generate test report
pnpm test:e2e --reporter=html
```

## Coverage Goals

**Target Coverage:**
- Unit Tests: >90% line coverage
- Integration: All critical user flows
- E2E: Complete scenarios from hotkey to paste

**Key Areas:**
- RealtimeTranscriber: All connection states and error paths
- Clipboard: All window types and error conditions
- Main App: All user interaction flows
- Error Handling: Network, permission, and system failures

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Unit Tests
  run: pnpm test:unit

- name: Run E2E Tests
  run: |
    # Set up virtual display for headless
    xvfb-run -a pnpm test:e2e
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}
```

### Test Reports
- Jest generates coverage reports in `coverage/`
- Playwright generates HTML reports in `playwright-report/`
- Both are excluded from git via `.gitignore`

## Performance Benchmarks

**Expected Performance:**
- Unit test suite: <30 seconds
- E2E test suite: <5 minutes
- Individual recording test: <10 seconds
- Memory usage: <100MB during tests

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY required"**
   - Set environment variable or use mock key for tests

2. **"Microphone permission denied"**
   - Grant mic access or use mock audio source

3. **"Electron process failed to start"**
   - Ensure app is built: `pnpm build`
   - Check Electron binary path

4. **"WebSocket connection timeout"**
   - Check network connectivity or use mock server

5. **"Notepad tests failing"**
   - Ensure Windows OS
   - Check UAC settings
   - Verify Notepad.exe accessibility

### Test Environment Variables

```bash
# Required for API tests
export OPENAI_API_KEY=test-key

# Optional test configuration
export NODE_ENV=test
export DEBUG_TESTS=true
export SKIP_E2E=false
export MOCK_AUDIO=true
```

## Contributing

When adding new tests:

1. **Unit Tests:** Place in `tests/` directory with `.test.ts` extension
2. **E2E Tests:** Place in `tests/e2e/` directory with `.spec.ts` extension
3. **Follow Patterns:** Use existing test structure and mocking patterns
4. **Document:** Add test descriptions and comments for complex scenarios
5. **Coverage:** Ensure new code paths are tested

---

**✅ Testing Suite Status: Complete**
- Step 24: RealtimeTranscriber unit tests ✅
- Step 25: Clipboard logic unit tests ✅  
- Step 26: End-to-end Playwright tests ✅

All testing requirements from the implementation plan have been fulfilled! 