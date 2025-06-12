import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  isRecording: boolean;
  className?: string;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ 
  isRecording, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Fallback for roundRect if not supported
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ) => {
    if (typeof (ctx as any).roundRect === 'function') {
      // Use native roundRect if available
      (ctx as any).roundRect(x, y, width, height, radius);
    } else {
      // Fallback implementation
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const bars = 20;
    const barWidth = width / bars;
    
    let time = 0;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (!isRecording) {
        // Show flat line when not recording
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        return;
      }

      // Generate animated waveform with dummy data
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      
      for (let i = 0; i < bars; i++) {
        // Create sine wave pattern with some randomness for realistic effect
        const baseHeight = Math.sin((time + i * 0.5) * 0.02) * 15;
        const randomHeight = Math.sin((time + i * 0.3) * 0.05) * 10;
        const barHeight = Math.abs(baseHeight + randomHeight) + 5;
        
        const x = i * barWidth + barWidth * 0.1;
        const barWidthActual = barWidth * 0.8;
        const y = centerY - barHeight / 2;
        
        // Draw rounded rectangle
        drawRoundedRect(ctx, x, y, barWidthActual, barHeight, 2);
        ctx.fill();
      }
      
      time += 1;
      
      if (isRecording) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isRecording) {
      animate();
    } else {
      animate(); // Draw static line
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={40}
      className={className}
      style={{
        display: 'block',
        margin: '0 auto'
      }}
    />
  );
}; 