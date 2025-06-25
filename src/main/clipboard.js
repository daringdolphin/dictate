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
var child_process_1 = require("child_process");
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
            var originalClipboard, success, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!this.isFocusedControlEditable()) {
                            console.log('Focused control is not editable; skipping paste');
                            return [2 /*return*/, false];
                        }
                        originalClipboard = electron_1.clipboard.readText();
                        return [4 /*yield*/, this.sleep(50)];
                    case 1:
                        _a.sent();
                        robot.keyTap('v', ['control']);
                        console.log('Sent Ctrl+V keystroke');
                        return [4 /*yield*/, this.sleep(150)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.detectPasteSuccess(originalClipboard)];
                    case 3:
                        success = _a.sent();
                        if (success) {
                            console.log('\u2705 Paste operation likely successful');
                            return [2 /*return*/, true];
                        }
                        else {
                            console.log('\u274C Paste operation likely failed');
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Error during paste attempt:', error_2);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Detect if paste was likely successful using multiple heuristics
     */
    ClipboardManager.prototype.detectPasteSuccess = function (originalText) {
        return __awaiter(this, void 0, void 0, function () {
            var currentClipboard, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        currentClipboard = electron_1.clipboard.readText();
                        if (currentClipboard !== originalText) {
                            console.log('Clipboard changed unexpectedly');
                            return [2 /*return*/, false];
                        }
                        if (!this.isFocusedControlEditable()) {
                            console.log('Focused control no longer editable during paste check');
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error detecting paste success:', error_3);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };

    /**
     * Get the class name of the currently focused control using Win32 APIs
     */
    ClipboardManager.prototype.getFocusedApplicationName = function () {
        try {
            var ps = "\nAdd-Type @\"\nusing System;\nusing System.Runtime.InteropServices;\npublic class Win32 {\n  [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();\n  [DllImport(\"user32.dll\")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr pid);\n  [DllImport(\"user32.dll\")] public static extern bool GetGUIThreadInfo(uint idThread, out GUITHREADINFO info);\n  [DllImport(\"user32.dll\")] public static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder className, int maxCount);\n}\n[StructLayout(LayoutKind.Sequential)]\npublic struct RECT { public int Left; public int Top; public int Right; public int Bottom; }\n[StructLayout(LayoutKind.Sequential)]\npublic struct GUITHREADINFO {\n  public int cbSize;\n  public int flags;\n  public IntPtr hwndActive;\n  public IntPtr hwndFocus;\n  public IntPtr hwndCapture;\n  public IntPtr hwndMenuOwner;\n  public IntPtr hwndMoveSize;\n  public IntPtr hwndCaret;\n  public RECT rcCaret;\n}\n\"@\n$hwnd = [Win32]::GetForegroundWindow()\n$tid = [Win32]::GetWindowThreadProcessId($hwnd, [IntPtr]::Zero)\n$info = New-Object GUITHREADINFO\n$info.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($info)\n[Win32]::GetGUIThreadInfo($tid, [ref]$info) | Out-Null\n$focus = $info.hwndFocus\nif($focus -eq [IntPtr]::Zero){ return }\n$class = New-Object System.Text.StringBuilder 128\n[Win32]::GetClassName($focus, $class, $class.Capacity) | Out-Null\n$class.ToString()\n";
            var encoded = Buffer.from(ps, 'utf16le').toString('base64');
            var result = (0, child_process_1.execSync)("powershell -NoProfile -EncodedCommand ".concat(encoded), { encoding: 'utf8' });
            var className = result.trim();
            return className || 'unknown';
        }
        catch (error) {
            console.error('Error getting focused application:', error);
            return 'unknown';
        }
    };

    ClipboardManager.prototype.isFocusedControlEditable = function () {
        var className = this.getFocusedApplicationName().toLowerCase();
        var editable = ['edit', 'richedit', 'textbox'];
        return editable.some(function (c) { return className.includes(c); });
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
