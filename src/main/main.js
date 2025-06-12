"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var tray_1 = require("./tray");
var history_1 = require("./history");
var clipboard_1 = require("./clipboard");
var shortcut_1 = require("./shortcut");
var realtimeTranscriber_1 = require("./realtimeTranscriber");
var VoiceClipApp = /** @class */ (function () {
    function VoiceClipApp() {
        var _this = this;
        this.overlayWindow = null;
        this.settingsWindow = null;
        this.recorderWindow = null;
        // Runtime settings (in-memory only)
        this.settings = {
            hotkey: 'Ctrl+Shift+Space',
            toast: true
        };
        this.currentState = 'idle';
        // Initialize core modules
        this.tray = new tray_1.SystemTray();
        this.history = new history_1.TranscriptHistory();
        this.clipboard = new clipboard_1.ClipboardManager();
        this.shortcut = new shortcut_1.ShortcutManager();
        this.transcriber = new realtimeTranscriber_1.RealtimeTranscriber();
        // Handle app events
        electron_1.app.whenReady().then(function () {
            _this.initialize();
        });
        electron_1.app.on('window-all-closed', function () {
            // On Windows, apps typically stay running until explicitly quit
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        electron_1.app.on('activate', function () {
            // On macOS, re-create window when dock icon is clicked
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                _this.initialize();
            }
        });
        electron_1.app.on('before-quit', function () {
            _this.cleanup();
        });
    }
    VoiceClipApp.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Initialize all components
                        return [4 /*yield*/, this.createWindows()];
                    case 1:
                        // Initialize all components
                        _a.sent();
                        this.setupTray();
                        this.setupShortcuts();
                        this.setupEventHandlers();
                        console.log('VoiceClip app initialized successfully');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error initializing VoiceClip:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    VoiceClipApp.prototype.createWindows = function () {
        return __awaiter(this, void 0, void 0, function () {
            var overlayPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Create the overlay window (hidden by default)
                        this.overlayWindow = new electron_1.BrowserWindow({
                            width: 220,
                            height: 220,
                            show: false,
                            frame: false,
                            transparent: true,
                            alwaysOnTop: true,
                            skipTaskbar: true,
                            resizable: false,
                            webPreferences: {
                                nodeIntegration: false,
                                contextIsolation: true,
                                preload: path.join(__dirname, '../renderer/overlay/preload.js')
                            }
                        });
                        overlayPath = path.join(__dirname, '../renderer/overlay/index.html');
                        return [4 /*yield*/, this.overlayWindow.loadFile(overlayPath)];
                    case 1:
                        _a.sent();
                        // Open DevTools in development
                        if (process.env.NODE_ENV === 'development') {
                            this.overlayWindow.webContents.openDevTools();
                        }
                        console.log('Overlay window created (hidden)');
                        return [2 /*return*/];
                }
            });
        });
    };
    VoiceClipApp.prototype.setupTray = function () {
        var _this = this;
        // Initialize system tray
        this.tray.initialize();
        // Handle tray events
        this.tray.on('copy-transcript', function (transcriptId) {
            var transcript = _this.history.getById(transcriptId);
            if (transcript) {
                _this.clipboard.copyAndPaste(transcript.text);
                console.log("Copied transcript from tray: ".concat(transcript.text.substring(0, 30), "..."));
            }
        });
        this.tray.on('show-settings', function () {
            _this.showSettingsWindow();
        });
        console.log('System tray initialized');
    };
    VoiceClipApp.prototype.setupShortcuts = function () {
        // Register global shortcut
        var success = this.shortcut.registerHotkey(this.settings.hotkey);
        if (!success) {
            console.error('Failed to register global shortcut');
            this.updateAppState('error');
            return;
        }
        console.log("Global shortcut registered: ".concat(this.settings.hotkey));
    };
    VoiceClipApp.prototype.setupEventHandlers = function () {
        var _this = this;
        // Shortcut events
        this.shortcut.on('recording-start', function () {
            _this.handleRecordingStart();
        });
        this.shortcut.on('recording-stop', function () {
            _this.handleRecordingStop();
        });
        this.shortcut.on('recording-cancel', function () {
            _this.handleRecordingCancel();
        });
    };
    /**
     * Setup audio chunk handling and IPC for Step 10 back-pressure
     */
    VoiceClipApp.prototype.setupAudioHandling = function () {
        // TODO: Will be called when recorder window sends audio chunks
        // For now, just log that setup is complete
        console.log('📊 Audio handling setup complete');
    };
    /**
     * Handle audio chunks from recorder window (Step 10)
     */
    VoiceClipApp.prototype.handleAudioChunk = function (buffer) {
        if (!this.transcriber.recording) {
            return;
        }
        // Check for back-pressure and pause if needed
        if (this.transcriber.isBackPressured) {
            console.warn('🚦 Back-pressure detected, pausing audio input');
            // TODO: Send pause signal to recorder window via IPC
            return;
        }
        // Send audio chunk to transcriber
        this.transcriber.append(buffer);
    };
    VoiceClipApp.prototype.handleRecordingStart = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🎤 Recording started');
                        this.updateAppState('recording');
                        // Show overlay
                        if (this.overlayWindow) {
                            this.overlayWindow.show();
                            console.log('Overlay window shown');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Start RealtimeTranscriber
                        return [4 /*yield*/, this.transcriber.start()];
                    case 2:
                        // Start RealtimeTranscriber
                        _a.sent();
                        // Setup transcriber event handlers
                        this.transcriber.on('transcript-partial', function (draft) {
                            // TODO: Forward to overlay window for live preview
                            console.log("\uD83D\uDCDD Live draft: \"".concat(draft, "\""));
                        });
                        this.transcriber.on('error', function (error) {
                            console.error('Transcriber error:', error);
                            _this.handleRecordingCancel();
                        });
                        // TODO: Create and show recorder window (Step 6)
                        // Setup audio chunk handling
                        this.setupAudioHandling();
                        console.log('✅ Recording session ready');
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Failed to start recording:', error_2);
                        this.handleRecordingCancel();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VoiceClipApp.prototype.handleRecordingStop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, transcript, durationSec, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('⏹️ Recording stopped');
                        this.updateAppState('transcribing');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        startTime = Date.now();
                        return [4 /*yield*/, this.transcriber.stop()];
                    case 2:
                        transcript = _a.sent();
                        durationSec = (Date.now() - startTime) / 1000;
                        return [4 /*yield*/, this.handleTranscriptReceived(transcript, durationSec)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Failed to get transcript:', error_3);
                        this.handleRecordingCancel();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    VoiceClipApp.prototype.handleRecordingCancel = function () {
        console.log('❌ Recording cancelled');
        this.updateAppState('idle');
        // Cancel transcriber
        this.transcriber.cancel();
        // Hide overlay without copying/pasting
        if (this.overlayWindow) {
            this.overlayWindow.hide();
            console.log('Overlay window hidden (cancelled)');
        }
    };
    VoiceClipApp.prototype.handleTranscriptReceived = function (text, durationSec) {
        return __awaiter(this, void 0, void 0, function () {
            var transcript, pasteSuccess;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCDD Transcript received: \"".concat(text, "\""));
                        transcript = this.history.push(text, durationSec);
                        // Update tray with new history
                        this.tray.updateHistory(this.history.list());
                        return [4 /*yield*/, this.clipboard.copyAndPaste(text)];
                    case 1:
                        pasteSuccess = _a.sent();
                        // Show toast if paste failed and setting is enabled
                        if (!pasteSuccess && this.settings.toast) {
                            // TODO: Show toast notification (Step 16)
                            console.log('📋 Text copied to clipboard (paste failed)');
                        }
                        // Hide overlay after a delay
                        setTimeout(function () {
                            if (_this.overlayWindow) {
                                _this.overlayWindow.hide();
                                console.log('Overlay window hidden (completed)');
                            }
                            _this.updateAppState('idle');
                        }, 500);
                        return [2 /*return*/];
                }
            });
        });
    };
    VoiceClipApp.prototype.updateAppState = function (state) {
        this.currentState = state;
        this.tray.updateState(state);
        console.log("App state changed to: ".concat(state));
    };
    VoiceClipApp.prototype.showSettingsWindow = function () {
        var _this = this;
        if (this.settingsWindow) {
            this.settingsWindow.focus();
            return;
        }
        this.settingsWindow = new electron_1.BrowserWindow({
            width: 600,
            height: 400,
            show: true,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });
        var settingsPath = path.join(__dirname, '../renderer/settings/index.html');
        this.settingsWindow.loadFile(settingsPath);
        this.settingsWindow.on('closed', function () {
            _this.settingsWindow = null;
        });
        console.log('Settings window opened');
    };
    VoiceClipApp.prototype.updateSettings = function (newSettings) {
        var oldHotkey = this.settings.hotkey;
        this.settings = __assign({}, newSettings);
        // Update hotkey if changed
        if (oldHotkey !== newSettings.hotkey) {
            var success = this.shortcut.updateHotkey(newSettings.hotkey);
            if (!success) {
                console.error('Failed to update hotkey, reverting to previous');
                this.settings.hotkey = oldHotkey;
            }
        }
        console.log('Settings updated:', this.settings);
    };
    VoiceClipApp.prototype.cleanup = function () {
        try {
            this.shortcut.destroy();
            this.tray.destroy();
            console.log('App cleanup completed');
        }
        catch (error) {
            console.error('Error during cleanup:', error);
        }
    };
    return VoiceClipApp;
}());
// Initialize the application
new VoiceClipApp();
