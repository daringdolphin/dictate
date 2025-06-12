import React, { useState, useEffect } from 'react';

interface HotkeyFieldProps {
  value: string;
  onChange: (hotkey: string) => void;
  placeholder?: string;
}

export const HotkeyField: React.FC<HotkeyFieldProps> = ({ 
  value, 
  onChange, 
  placeholder = "Press keys to set hotkey" 
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const formatHotkey = (keys: Set<string>): string => {
    const keyArray = Array.from(keys);
    const modifiers = keyArray.filter(key => 
      ['Control', 'Shift', 'Alt', 'Meta'].includes(key)
    ).map(key => {
      if (key === 'Control') return 'Ctrl';
      if (key === 'Meta') return 'Cmd';
      return key;
    });
    
    const nonModifiers = keyArray.filter(key => 
      !['Control', 'Shift', 'Alt', 'Meta'].includes(key)
    );
    
    return [...modifiers, ...nonModifiers].join('+');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isCapturing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const newKeys = new Set(pressedKeys);
    
    if (e.ctrlKey) newKeys.add('Control');
    if (e.shiftKey) newKeys.add('Shift');
    if (e.altKey) newKeys.add('Alt');
    if (e.metaKey) newKeys.add('Meta');
    
    // Add the actual key if it's not a modifier
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      newKeys.add(e.key === ' ' ? 'Space' : e.key);
    }
    
    setPressedKeys(newKeys);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isCapturing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // If we have at least one non-modifier key, finalize the hotkey
    const nonModifiers = Array.from(pressedKeys).filter(key => 
      !['Control', 'Shift', 'Alt', 'Meta'].includes(key)
    );
    
    if (nonModifiers.length > 0) {
      const hotkey = formatHotkey(pressedKeys);
      onChange(hotkey);
      setIsCapturing(false);
      setPressedKeys(new Set());
    }
  };

  const startCapture = () => {
    setIsCapturing(true);
    setPressedKeys(new Set());
  };

  const cancelCapture = () => {
    setIsCapturing(false);
    setPressedKeys(new Set());
  };

  const displayValue = isCapturing 
    ? (pressedKeys.size > 0 ? formatHotkey(pressedKeys) : "Press keys...")
    : (value || placeholder);

  return (
    <div className="hotkey-field">
      <label className="hotkey-label">Recording Hotkey:</label>
      <div className="hotkey-input-container">
        <input
          type="text"
          className={`hotkey-input ${isCapturing ? 'capturing' : ''}`}
          value={displayValue}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onFocus={startCapture}
          onBlur={cancelCapture}
          readOnly
          placeholder={placeholder}
        />
        {isCapturing && (
          <button 
            className="cancel-capture" 
            onClick={cancelCapture}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
      <p className="hotkey-hint">
        Click the field and press your desired key combination. 
        Include modifiers like Ctrl, Shift, Alt for global shortcuts.
      </p>
    </div>
  );
}; 