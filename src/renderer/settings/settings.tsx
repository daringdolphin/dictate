import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HotkeyField } from './components/HotkeyField';
import { ToggleSwitch } from './components/ToggleSwitch';
import { Settings } from '../../common/types';
import { IPC } from '../../common/ipcChannels';

type TabId = 'general' | 'about';

const SettingsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<Settings>({
    hotkey: 'Ctrl+Shift+Space',
    toast: true
  });

  // Load current settings on mount
  useEffect(() => {
    // Request current settings from main process
    window.electronAPI?.invoke('get-current-settings').then((currentSettings: Settings) => {
      if (currentSettings) {
        setSettings(currentSettings);
      }
    }).catch(console.error);
  }, []);

  const handleHotkeyChange = (newHotkey: string) => {
    const updatedSettings = { ...settings, hotkey: newHotkey };
    setSettings(updatedSettings);
    
    // Send settings update to main process
    window.electronAPI?.send(IPC.settingsUpdated, { settings: updatedSettings });
  };

  const handleToastToggle = (enabled: boolean) => {
    const updatedSettings = { ...settings, toast: enabled };
    setSettings(updatedSettings);
    
    // Send settings update to main process
    window.electronAPI?.send(IPC.settingsUpdated, { settings: updatedSettings });
  };

  const renderGeneralTab = () => (
    <div className="settings-tab-content">
      <h2>General Settings</h2>
      
      <div className="settings-section">
        <HotkeyField
          value={settings.hotkey}
          onChange={handleHotkeyChange}
          placeholder="Ctrl+Shift+Space"
        />
      </div>

      <div className="settings-section">
        <ToggleSwitch
          label="Show toast notifications"
          checked={settings.toast}
          onChange={handleToastToggle}
          description="Show a notification when text is copied to clipboard instead of being pasted"
        />
      </div>

      <div className="settings-note">
        <p><strong>Note:</strong> Global shortcuts work system-wide when VoiceClip is running. 
        If a shortcut conflicts with another application, VoiceClip will fall back to the default.</p>
      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="settings-tab-content">
      <h2>About VoiceClip</h2>
      
      <div className="about-section">
        <h3>Version</h3>
        <p>VoiceClip v1.0.0</p>
      </div>

      <div className="about-section">
        <h3>How it works</h3>
        <p>VoiceClip uses OpenAI's Whisper API to transcribe your speech in real-time. 
        Simply hold your configured hotkey, speak, and release to have your words 
        automatically typed where your cursor is.</p>
      </div>

      <div className="about-section">
        <h3>API Costs</h3>
        <p><strong>Whisper API pricing:</strong> $0.006 per minute of audio</p>
        <p>A typical 10-second voice clip costs approximately $0.001 (one-tenth of a cent). 
        The cost scales linearly with recording duration.</p>
        <p>You need to provide your own OpenAI API key via the <code>OPENAI_API_KEY</code> environment variable.</p>
      </div>

      <div className="about-section">
        <h3>Privacy</h3>
        <p>VoiceClip processes audio locally and sends it securely to OpenAI's API. 
        No audio or transcripts are stored on your device permanently - everything is kept in memory only.</p>
      </div>

      <div className="about-section">
        <h3>Support</h3>
        <p>If you encounter issues, check that:</p>
        <ul>
          <li>Your microphone permissions are enabled</li>
          <li>Your <code>OPENAI_API_KEY</code> environment variable is set</li>
          <li>Your chosen hotkey doesn't conflict with other applications</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="settings-app">
      <div className="settings-header">
        <h1>VoiceClip Settings</h1>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`settings-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'about' && renderAboutTab()}
      </div>
    </div>
  );
};

// Type declaration for electron API
declare global {
  interface Window {
    electronAPI?: {
      send: (channel: string, data?: any) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

// Mount the React app
const container = document.getElementById('settings-root');
if (container) {
  const root = createRoot(container);
  root.render(<SettingsApp />);
} 