"use strict";
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
exports.ClipboardManager = void 0;
var electron_1 = require("electron");
var robot = require("robotjs");
var ClipboardManager = /** @class */ (function () {
    function ClipboardManager() {
        console.log('Clipboard manager initialized');
    }
    /**
     * Copy text to clipboard and attempt to paste it
     * Returns true if paste was likely successful, false if toast should be shown
     */
    ClipboardManager.prototype.copyAndPaste = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var pasteSuccess, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Always copy to clipboard first
                        electron_1.clipboard.writeText(text);
                        console.log("Text copied to clipboard: \"".concat(this.truncateText(text, 50), "\""));
                        return [4 /*yield*/, this.attemptPaste()];
                    case 1:
                        pasteSuccess = _a.sent();
                        if (pasteSuccess) {
                            console.log('Paste operation likely successful');
                            return [2 /*return*/, true];
                        }
                        else {
                            console.log('Paste operation likely failed - will show toast');
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error in copy/paste operation:', error_1);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Attempt to paste using synthetic Ctrl+V
     * Returns true if likely successful, false if should show toast
     */
    ClipboardManager.prototype.attemptPaste = function () {
        return __awaiter(this, void 0, void 0, function () {
            var originalClipboard, currentClipboard, focusedApp_1, problematicApps, isPotentiallyProblematic, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        originalClipboard = electron_1.clipboard.readText();
                        // Small delay to ensure focus is stable
                        return [4 /*yield*/, this.sleep(50)];
                    case 1:
                        // Small delay to ensure focus is stable
                        _a.sent();
                        // Simulate Ctrl+V
                        robot.keyTap('v', ['control']);
                        console.log('Sent Ctrl+V keystroke');
                        // Wait a bit for the paste operation to complete
                        return [4 /*yield*/, this.sleep(100)];
                    case 2:
                        // Wait a bit for the paste operation to complete
                        _a.sent();
                        currentClipboard = electron_1.clipboard.readText();
                        focusedApp_1 = this.getFocusedApplicationName();
                        problematicApps = ['elevated', 'admin', 'system'];
                        isPotentiallyProblematic = problematicApps.some(function (app) {
                            return focusedApp_1.toLowerCase().includes(app);
                        });
                        if (isPotentiallyProblematic) {
                            console.log('Detected potentially problematic application for pasting');
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true]; // Assume success for most cases
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error during paste attempt:', error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the name of the currently focused application
     * This is a simplified version - a real implementation would use Win32 APIs
     */
    ClipboardManager.prototype.getFocusedApplicationName = function () {
        try {
            // This is a placeholder. In a real implementation, we would use
            // Windows APIs to get the focused window information
            return 'unknown';
        }
        catch (error) {
            console.error('Error getting focused application:', error);
            return 'unknown';
        }
    };
    /**
     * Simple async sleep utility
     */
    ClipboardManager.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    /**
     * Verify if clipboard operation succeeded by comparing content
     */
    ClipboardManager.prototype.verifyClipboardContent = function (expectedText) {
        try {
            var actualText = electron_1.clipboard.readText();
            return actualText === expectedText;
        }
        catch (error) {
            console.error('Error verifying clipboard content:', error);
            return false;
        }
    };
    /**
     * Get current clipboard text
     */
    ClipboardManager.prototype.getClipboardText = function () {
        try {
            return electron_1.clipboard.readText();
        }
        catch (error) {
            console.error('Error reading clipboard:', error);
            return '';
        }
    };
    ClipboardManager.prototype.truncateText = function (text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    };
    return ClipboardManager;
}());
exports.ClipboardManager = ClipboardManager;
