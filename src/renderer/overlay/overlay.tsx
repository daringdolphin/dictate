import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { WaveformCanvas } from './components/WaveformCanvas';
import { TimerLabel } from './components/TimerLabel';
import { Spinner } from './components/Spinner';
import { Toast } from './components/Toast';
import { OverlayStatus, ToastMessage } from '../../common/types';
import { IPC } from '../../common/ipcChannels';

interface OverlayState {
  status: OverlayStatus;
  timerSec: number;
  draft?: string;
  isVisible: boolean;
  toast?: ToastMessage | null;
}

const OverlayApp: React.FC = () => {
  const [state, setState] = useState<OverlayState>({
    status: 'recording',
    timerSec: 0,
    draft: undefined,
    isVisible: true,
    toast: null
  });

  const timerRef = useRef<NodeJS.Timeout>();
  const fadeTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle toast hide
  const handleToastHide = () => {
    setState(prev => ({ ...prev, toast: null }));
  };

  // Timer effect - runs when recording
  useEffect(() => {
    if (state.status === 'recording') {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timerSec: prev.timerSec + 1
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status]);

  // Fade-out effect when done
  useEffect(() => {
    if (state.status === 'done') {
      fadeTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: false }));
        // Reset state for next recording
        setTimeout(() => {
          setState({
            status: 'recording',
            timerSec: 0,
            draft: undefined,
            isVisible: true,
            toast: null
          });
        }, 500);
      }, 500);
    }

    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [state.status]);

  // IPC Event listeners for Step 14
  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    // Listen for transcript partial updates
    const handleTranscriptPartial = (event: any, draft: string) => {
      setState(prev => ({ ...prev, draft }));
    };

    // Listen for transcript final (move to done state)
    const handleTranscriptFinal = (event: any, text: string) => {
      setState(prev => ({ 
        ...prev, 
        status: 'done',
        draft: text
      }));
    };

    // Listen for overlay updates from main process
    const handleOverlayUpdate = (event: any, update: Partial<OverlayState>) => {
      setState(prev => ({ ...prev, ...update }));
    };

    // Listen for toast messages
    const handleShowToast = (event: any, toastData: ToastMessage) => {
      setState(prev => ({ ...prev, toast: toastData }));
    };

    // Listen for recording state changes
    const handleRecordingStart = () => {
      setState(prev => ({ 
        ...prev, 
        status: 'recording',
        timerSec: 0,
        draft: undefined,
        isVisible: true,
        toast: null
      }));
    };

    const handleRecordingStop = () => {
      setState(prev => ({ ...prev, status: 'transcribing' }));
    };

    const handleRecordingCancel = () => {
      setState(prev => ({ ...prev, status: 'cancelled' }));
      // Hide after showing cancelled message briefly
      setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: false }));
      }, 800);
    };

    const handleRecordingError = () => {
      setState(prev => ({ ...prev, status: 'error' }));
      // Hide after showing error message for longer duration
      setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: false }));
      }, 2000);
    };

    // Register IPC listeners
    ipcRenderer.on(IPC.transcriptPartial, handleTranscriptPartial);
    ipcRenderer.on(IPC.transcriptFinal, handleTranscriptFinal);
    ipcRenderer.on(IPC.overlayUpdate, handleOverlayUpdate);
    ipcRenderer.on(IPC.showToast, handleShowToast);
    ipcRenderer.on(IPC.recordingStart, handleRecordingStart);
    ipcRenderer.on(IPC.recordingStop, handleRecordingStop);
    ipcRenderer.on(IPC.recordingCancel, handleRecordingCancel);
    ipcRenderer.on(IPC.recordingError, handleRecordingError);

    // Cleanup
    return () => {
      ipcRenderer.removeListener(IPC.transcriptPartial, handleTranscriptPartial);
      ipcRenderer.removeListener(IPC.transcriptFinal, handleTranscriptFinal);
      ipcRenderer.removeListener(IPC.overlayUpdate, handleOverlayUpdate);
      ipcRenderer.removeListener(IPC.showToast, handleShowToast);
      ipcRenderer.removeListener(IPC.recordingStart, handleRecordingStart);
      ipcRenderer.removeListener(IPC.recordingStop, handleRecordingStop);
      ipcRenderer.removeListener(IPC.recordingCancel, handleRecordingCancel);
      ipcRenderer.removeListener(IPC.recordingError, handleRecordingError);
    };
  }, []);

  // Render different states
  const renderContent = () => {
    switch (state.status) {
      case 'recording':
        return (
          <>
            <WaveformCanvas isRecording={true} />
            <TimerLabel timerSec={state.timerSec} />
            <div style={{ 
              fontSize: '11px', 
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              Recording...
            </div>
          </>
        );

      case 'transcribing':
        return (
          <>
            <Spinner size={32} />
            <div style={{ 
              fontSize: '11px', 
              color: 'rgba(255, 255, 255, 0.9)',
              marginTop: '12px',
              textAlign: 'center'
            }}>
              Transcribing...
            </div>
            {state.draft && (
              <div style={{ 
                fontSize: '10px', 
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {state.draft}
              </div>
            )}
          </>
        );

      case 'done':
        return (
          <>
            <div style={{ 
              fontSize: '11px', 
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center'
            }}>
              ✓ Done
            </div>
            {state.draft && (
              <div style={{ 
                fontSize: '10px', 
                color: 'rgba(255, 255, 255, 0.7)',
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {state.draft}
              </div>
            )}
          </>
        );

      case 'cancelled':
        return (
          <>
            <div style={{ 
              fontSize: '11px', 
              color: 'rgba(255, 193, 7, 0.9)',
              textAlign: 'center'
            }}>
              ✗ Cancelled
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <div style={{ 
              fontSize: '11px', 
              color: 'rgba(220, 53, 69, 0.9)',
              textAlign: 'center'
            }}>
              ⚠ Error
            </div>
            <div style={{ 
              fontSize: '9px', 
              color: 'rgba(220, 53, 69, 0.7)',
              marginTop: '8px',
              textAlign: 'center',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Check microphone or network
            </div>
          </>
        );

      default:
        return <div>Unknown state</div>;
    }
  };

  return (
    <div style={{
      width: '220px',
      height: '220px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      borderRadius: '50%',
      color: 'white',
      fontSize: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      opacity: state.isVisible ? 1 : 0,
      transition: 'opacity 0.5s ease-out',
      gap: '8px',
      padding: '20px',
      position: 'relative'
    }}>
      {renderContent()}
      
      {/* Toast notification */}
      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type || 'info'}
          visible={!!state.toast}
          onHide={handleToastHide}
          duration={2500}
        />
      )}
    </div>
  );
};

// Mount the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OverlayApp />);
} 