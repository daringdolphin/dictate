"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutManager = void 0;
var electron_1 = require("electron");
var events_1 = require("events");
var ShortcutManager = /** @class */ (function (_super) {
    __extends(ShortcutManager, _super);
    function ShortcutManager() {
        var _this = _super.call(this) || this;
        _this.currentHotkey = 'Ctrl+Shift+Space';
        _this.isRecording = false;
        _this.cancelShortcut = 'Escape';
        _this.cancelRegistered = false;
        console.log('Shortcut manager initialized');
        return _this;
    }
    /**
     * Register the main recording hotkey
     */
    ShortcutManager.prototype.registerHotkey = function (hotkey) {
        var _this = this;
        if (hotkey) {
            this.currentHotkey = hotkey;
        }
        try {
            // Unregister existing hotkey if any
            this.unregisterHotkey();
            // Register the new hotkey
            var success = electron_1.globalShortcut.register(this.currentHotkey, function () {
                _this.handleHotkeyPress();
            });
            if (success) {
                console.log("Global shortcut registered: ".concat(this.currentHotkey));
                return true;
            }
            else {
                console.error("Failed to register global shortcut: ".concat(this.currentHotkey));
                // Try fallback to default if current failed
                if (this.currentHotkey !== 'Ctrl+Shift+Space') {
                    console.log('Attempting fallback to default shortcut...');
                    this.currentHotkey = 'Ctrl+Shift+Space';
                    return this.registerHotkey();
                }
                return false;
            }
        }
        catch (error) {
            console.error('Error registering global shortcut:', error);
            return false;
        }
    };
    /**
     * Unregister the current hotkey
     */
    ShortcutManager.prototype.unregisterHotkey = function () {
        try {
            if (electron_1.globalShortcut.isRegistered(this.currentHotkey)) {
                electron_1.globalShortcut.unregister(this.currentHotkey);
                console.log("Global shortcut unregistered: ".concat(this.currentHotkey));
            }
        }
        catch (error) {
            console.error('Error unregistering global shortcut:', error);
        }
    };
    /**
     * Handle the main hotkey press/release
     */
    ShortcutManager.prototype.handleHotkeyPress = function () {
        if (!this.isRecording) {
            // Start recording
            this.startRecording();
        }
        else {
            // Stop recording (this handles key release)
            this.stopRecording();
        }
    };
    /**
     * Start recording session
     */
    ShortcutManager.prototype.startRecording = function () {
        if (this.isRecording)
            return;
        this.isRecording = true;
        console.log('Recording started via hotkey');
        // Register cancel shortcut (Esc) only while recording
        this.registerCancelShortcut();
        // Emit start event
        this.emit('recording-start');
    };
    /**
     * Stop recording session
     */
    ShortcutManager.prototype.stopRecording = function () {
        if (!this.isRecording)
            return;
        this.isRecording = false;
        console.log('Recording stopped via hotkey');
        // Unregister cancel shortcut
        this.unregisterCancelShortcut();
        // Emit stop event
        this.emit('recording-stop');
    };
    /**
     * Cancel recording session
     */
    ShortcutManager.prototype.cancelRecording = function () {
        if (!this.isRecording)
            return;
        this.isRecording = false;
        console.log('Recording cancelled via Escape key');
        // Unregister cancel shortcut
        this.unregisterCancelShortcut();
        // Emit cancel event
        this.emit('recording-cancel');
    };
    /**
     * Register temporary Escape key for cancellation
     */
    ShortcutManager.prototype.registerCancelShortcut = function () {
        var _this = this;
        try {
            if (!this.cancelRegistered) {
                var success = electron_1.globalShortcut.register(this.cancelShortcut, function () {
                    _this.cancelRecording();
                });
                if (success) {
                    this.cancelRegistered = true;
                    console.log('Cancel shortcut (Escape) registered');
                }
                else {
                    console.warn('Failed to register cancel shortcut');
                }
            }
        }
        catch (error) {
            console.error('Error registering cancel shortcut:', error);
        }
    };
    /**
     * Unregister the cancel shortcut
     */
    ShortcutManager.prototype.unregisterCancelShortcut = function () {
        try {
            if (this.cancelRegistered) {
                electron_1.globalShortcut.unregister(this.cancelShortcut);
                this.cancelRegistered = false;
                console.log('Cancel shortcut (Escape) unregistered');
            }
        }
        catch (error) {
            console.error('Error unregistering cancel shortcut:', error);
        }
    };
    /**
     * Update hotkey from settings
     */
    ShortcutManager.prototype.updateHotkey = function (newHotkey) {
        console.log("Updating hotkey from ".concat(this.currentHotkey, " to ").concat(newHotkey));
        return this.registerHotkey(newHotkey);
    };
    /**
     * Get current hotkey
     */
    ShortcutManager.prototype.getCurrentHotkey = function () {
        return this.currentHotkey;
    };
    /**
     * Get recording state
     */
    ShortcutManager.prototype.isCurrentlyRecording = function () {
        return this.isRecording;
    };
    /**
     * Check if hotkey is available
     */
    ShortcutManager.prototype.isHotkeyAvailable = function (hotkey) {
        try {
            // Try to register temporarily to check availability
            var available = electron_1.globalShortcut.register(hotkey, function () { });
            if (available) {
                electron_1.globalShortcut.unregister(hotkey);
                return true;
            }
            return false;
        }
        catch (error) {
            return false;
        }
    };
    /**
     * Cleanup all shortcuts
     */
    ShortcutManager.prototype.destroy = function () {
        try {
            this.unregisterHotkey();
            this.unregisterCancelShortcut();
            electron_1.globalShortcut.unregisterAll();
            console.log('All shortcuts unregistered');
        }
        catch (error) {
            console.error('Error during shortcut cleanup:', error);
        }
    };
    return ShortcutManager;
}(events_1.EventEmitter));
exports.ShortcutManager = ShortcutManager;
