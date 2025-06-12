import React from 'react';

interface TimerLabelProps {
  timerSec: number;
  className?: string;
}

export const TimerLabel: React.FC<TimerLabelProps> = ({ 
  timerSec, 
  className = '' 
}) => {
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`timer-label ${className}`}
      style={{
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        letterSpacing: '0.5px',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
      }}
    >
      {formatTime(timerSec)}
    </div>
  );
}; 