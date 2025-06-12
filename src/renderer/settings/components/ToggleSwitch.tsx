import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  label, 
  checked, 
  onChange, 
  description 
}) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <div className="toggle-switch-container">
      <div className="toggle-switch-main">
        <label className="toggle-switch-label">{label}</label>
        <div 
          className={`toggle-switch ${checked ? 'checked' : ''}`}
          onClick={handleToggle}
          role="switch"
          aria-checked={checked}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleToggle();
            }
          }}
        >
          <div className={`toggle-switch-slider ${checked ? 'checked' : ''}`} />
        </div>
      </div>
      {description && (
        <p className="toggle-switch-description">{description}</p>
      )}
    </div>
  );
}; 