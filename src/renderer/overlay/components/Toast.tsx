import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error';
  visible: boolean;
  onHide?: () => void;
  duration?: number; // Duration in milliseconds before auto-hide
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  visible, 
  onHide,
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Wait for fade-out animation to complete
        setTimeout(() => {
          setIsVisible(false);
          onHide?.();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  }, [visible, duration, onHide]);

  if (!isVisible) {
    return null;
  }

  const getToastColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.9)'; // Green
      case 'error':
        return 'rgba(239, 68, 68, 0.9)'; // Red
      case 'info':
      default:
        return 'rgba(59, 130, 246, 0.9)'; // Blue
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: getToastColor(),
        backdropFilter: 'blur(10px)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '500',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        opacity: isAnimating ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        zIndex: 1000,
        maxWidth: '180px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}
    >
      <span style={{ fontSize: '12px' }}>{getIcon()}</span>
      <span>{message}</span>
    </div>
  );
}; 