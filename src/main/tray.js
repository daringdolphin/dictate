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
exports.SystemTray = void 0;
var electron_1 = require("electron");
var events_1 = require("events");
var SystemTray = /** @class */ (function (_super) {
    __extends(SystemTray, _super);
    function SystemTray() {
        var _this = _super.call(this) || this;
        _this.tray = null;
        _this.currentState = 'idle';
        _this.transcriptHistory = [];
        return _this;
    }
    SystemTray.prototype.initialize = function () {
        // Create tray icon (using a default for now - will need actual icons later)
        var iconPath = this.getIconPath('idle');
        this.tray = new electron_1.Tray(iconPath);
        // Set initial tooltip
        this.updateTooltip();
        // Set initial context menu
        this.updateContextMenu();
        console.log('System tray initialized');
    };
    SystemTray.prototype.updateState = function (state) {
        this.currentState = state;
        if (this.tray) {
            // Update icon
            var iconPath = this.getIconPath(state);
            this.tray.setImage(iconPath);
            // Update tooltip
            this.updateTooltip();
        }
    };
    SystemTray.prototype.updateHistory = function (history) {
        this.transcriptHistory = history;
        this.updateContextMenu();
    };
    SystemTray.prototype.getIconPath = function (state) {
        // For now, use a default system icon. In a real app, these would be custom icons
        // TODO: Add actual icon files in assets/icons/
        switch (state) {
            case 'idle':
                return electron_1.nativeImage.createEmpty().toDataURL();
            case 'recording':
                return electron_1.nativeImage.createEmpty().toDataURL();
            case 'transcribing':
                return electron_1.nativeImage.createEmpty().toDataURL();
            case 'error':
                return electron_1.nativeImage.createEmpty().toDataURL();
            default:
                return electron_1.nativeImage.createEmpty().toDataURL();
        }
    };
    SystemTray.prototype.updateTooltip = function () {
        if (!this.tray)
            return;
        var stateText = this.currentState.charAt(0).toUpperCase() + this.currentState.slice(1);
        this.tray.setToolTip("VoiceClip - ".concat(stateText));
    };
    SystemTray.prototype.updateContextMenu = function () {
        var _this = this;
        if (!this.tray)
            return;
        var menuItems = [];
        // Recent transcripts section
        if (this.transcriptHistory.length > 0) {
            menuItems.push({
                label: "Recent (".concat(this.transcriptHistory.length, ")"),
                type: 'submenu',
                submenu: this.transcriptHistory.slice(0, 10).map(function (transcript, index) { return ({
                    label: _this.truncateText(transcript.text, 40),
                    click: function () {
                        _this.emit('copy-transcript', transcript.id);
                    }
                }); })
            });
            menuItems.push({ type: 'separator' });
        }
        // Settings
        menuItems.push({
            label: 'Settings...',
            click: function () {
                _this.emit('show-settings');
            }
        });
        menuItems.push({ type: 'separator' });
        // Quit
        menuItems.push({
            label: 'Quit',
            click: function () {
                electron_1.app.quit();
            }
        });
        var contextMenu = electron_1.Menu.buildFromTemplate(menuItems);
        this.tray.setContextMenu(contextMenu);
    };
    SystemTray.prototype.truncateText = function (text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    };
    SystemTray.prototype.destroy = function () {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    };
    return SystemTray;
}(events_1.EventEmitter));
exports.SystemTray = SystemTray;
