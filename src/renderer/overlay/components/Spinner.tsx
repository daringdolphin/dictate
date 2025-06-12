import React, { useEffect } from 'react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  // Add CSS animation to the document head if not already present
  useEffect(() => {
    const animationId = 'voiceclip-spinner-animation';
    if (!document.getElementById(animationId)) {
      const style = document.createElement('style');
      style.id = animationId;
      style.textContent = `
        @keyframes voiceclip-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div 
      className={`spinner ${className}`}
      style={{
        width: size,
        height: size,
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'voiceclip-spin 1s linear infinite',
        margin: '0 auto'
      }}
    />
  );
}; 