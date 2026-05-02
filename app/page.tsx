'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ==================== TYPES ====================
type TimerPhase = 'focus' | 'break' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

interface Settings {
  focusDuration: number;      // minutes, default 25
  breakDuration: number;      // minutes, default 5
  longBreakDuration: number;  // minutes, default 15
  sessionsUntilLongBreak: number; // default 4
}

// ==================== CONSTANTS ====================
const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

// ==================== AUDIO ====================
function playBeep(frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 0.1) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

function playTick() {
  playBeep(800, 0.05, 'square', 0.03);
}

function playPhaseComplete() {
  setTimeout(() => playBeep(523, 0.15, 'square', 0.1), 0);
  setTimeout(() => playBeep(659, 0.15, 'square', 0.1), 150);
  setTimeout(() => playBeep(784, 0.2, 'square', 0.1), 300);
}

function playClick() {
  playBeep(200, 0.03, 'square', 0.05);
}

// ==================== PIXEL TOMATO SVG ====================
function PixelTomato({ status }: { status: TimerStatus; phase: TimerPhase }) {
  const animClass = status === 'running' ? 'tomato-bounce' : status === 'paused' ? '' : '';

  return (
    <div className={`${animClass} inline-block`} style={{ imageRendering: 'pixelated' }}>
      <svg width="48" height="48" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        {/* Leaf/stem */}
        <rect x="7" y="0" width="2" height="3" fill="#39ff14" />
        {/* Tomato body */}
        <rect x="3" y="3" width="10" height="10" fill="#ff2d2d" />
        <rect x="2" y="4" width="1" height="8" fill="#ff2d2d" />
        <rect x="13" y="4" width="1" height="8" fill="#ff2d2d" />
        <rect x="4" y="2" width="8" height="2" fill="#ff2d2d" />
        <rect x="5" y="1" width="6" height="1" fill="#cc0000" />
        {/* Highlight */}
        <rect x="5" y="5" width="2" height="2" fill="#ff6b6b" />
        <rect x="6" y="3" width="2" height="1" fill="#ff6b6b" />
        {/* Stem detail */}
        <rect x="6" y="2" width="1" height="1" fill="#cc0000" />
        <rect x="9" y="1" width="1" height="1" fill="#cc0000" />
        {/* Eyes */}
        <rect x="6" y="7" width="1" height="1" fill="#0a0a0a" />
        <rect x="9" y="7" width="1" height="1" fill="#0a0a0a" />
        {/* Mouth */}
        <rect x="6" y="10" width="4" height="1" fill="#0a0a0a" />
        <rect x="7" y="11" width="2" height="1" fill="#0a0a0a" />
        {/* Leaf glow */}
        <rect x="7" y="1" width="2" height="1" fill="#39ff14" opacity="0.6" />
      </svg>
    </div>
  );
}

// ==================== SETTINGS PANEL ====================
function SettingsPanel({
  settings,
  onSettingsChange,
  sessionsCompleted,
}: {
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
  sessionsCompleted: number;
}) {
  const [open, setOpen] = useState(false);

  const update = (key: keyof Settings, delta: number) => {
    const newVal = Math.max(1, Math.min(key === 'focusDuration' ? 60 : key === 'sessionsUntilLongBreak' ? 10 : 30, settings[key] + delta));
    playClick();
    onSettingsChange({ ...settings, [key]: newVal });
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <button className="pixel-btn" onClick={() => { setOpen(!open); playClick(); }} style={{ fontSize: '7px' }}>
        [ SETTINGS ]
      </button>

      {open && (
        <div className="pixel-border pixel-border-inner" style={{ marginTop: '12px', fontSize: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span>FOCUS (min)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="pixel-btn" onClick={() => update('focusDuration', -1)} style={{ padding: '4px 8px', fontSize: '8px' }}>-</button>
              <span style={{ minWidth: '30px', textAlign: 'center' }}>{settings.focusDuration}</span>
              <button className="pixel-btn" onClick={() => update('focusDuration', 1)} style={{ padding: '4px 8px', fontSize: '8px' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span>BREAK (min)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="pixel-btn" onClick={() => update('breakDuration', -1)} style={{ padding: '4px 8px', fontSize: '8px' }}>-</button>
              <span style={{ minWidth: '30px', textAlign: 'center' }}>{settings.breakDuration}</span>
              <button className="pixel-btn" onClick={() => update('breakDuration', 1)} style={{ padding: '4px 8px', fontSize: '8px' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span>LONG BREAK</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="pixel-btn" onClick={() => update('longBreakDuration', -1)} style={{ padding: '4px 8px', fontSize: '8px' }}>-</button>
              <span style={{ minWidth: '30px', textAlign: 'center' }}>{settings.longBreakDuration}</span>
              <button className="pixel-btn" onClick={() => update('longBreakDuration', 1)} style={{ padding: '4px 8px', fontSize: '8px' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SESSIONS/ROUND</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="pixel-btn" onClick={() => update('sessionsUntilLongBreak', -1)} style={{ padding: '4px 8px', fontSize: '8px' }}>-</button>
              <span style={{ minWidth: '30px', textAlign: 'center' }}>{settings.sessionsUntilLongBreak}</span>
              <button className="pixel-btn" onClick={() => update('sessionsUntilLongBreak', 1)} style={{ padding: '4px 8px', fontSize: '8px' }}>+</button>
            </div>
          </div>

          <div style={{ marginTop: '10px', textAlign: 'center', color: '#ff6b35' }}>
            SESSION {sessionsCompleted + 1} / {settings.sessionsUntilLongBreak}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function Home() {
  // State
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(-1);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crt-pomodoro-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        setTimeLeft(parsed.focusDuration * 60);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Save settings on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crt-pomodoro-settings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

  // Get current phase duration in seconds
  const getPhaseDuration = useCallback((p: TimerPhase): number => {
    switch (p) {
      case 'focus': return settings.focusDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings]);

  // Clear interval helper
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start the timer
  const startTimer = useCallback(() => {
    clearTimer();
    const now = Date.now();
    endTimeRef.current = now + timeLeft * 1000;
    lastSecondRef.current = Math.floor(timeLeft);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(((endTimeRef.current || now) - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Tick sound every second
      const currentSec = remaining;
      if (currentSec !== lastSecondRef.current && currentSec > 0) {
        lastSecondRef.current = currentSec;
        playTick();
      }

      if (remaining <= 0) {
        clearTimer();
        playPhaseComplete();
        handlePhaseEnd();
      }
    }, 100);
  }, [timeLeft, clearTimer]);

  // Handle phase end
  const handlePhaseEnd = useCallback(() => {
    setStatus('idle');

    if (phase === 'focus') {
      const newCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newCompleted);

      if (newCompleted % settings.sessionsUntilLongBreak === 0) {
        setPhase('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setPhase('break');
        setTimeLeft(settings.breakDuration * 60);
      }
    } else {
      // Break ended, go back to focus
      setPhase('focus');
      setTimeLeft(settings.focusDuration * 60);
    }
  }, [phase, sessionsCompleted, settings]);

  // Toggle start/pause
  const toggleTimer = useCallback(() => {
    playClick();
    if (status === 'running') {
      clearTimer();
      setStatus('paused');
    } else {
      setStatus('running');
      startTimer();
    }
  }, [status, clearTimer, startTimer]);

  // Reset timer
  const resetTimer = useCallback(() => {
    playClick();
    clearTimer();
    setStatus('idle');
    setTimeLeft(getPhaseDuration(phase));
    endTimeRef.current = null;
    lastSecondRef.current = -1;
  }, [clearTimer, phase, getPhaseDuration]);

  // Skip phase
  const skipPhase = useCallback(() => {
    playClick();
    clearTimer();
    endTimeRef.current = null;
    lastSecondRef.current = -1;
    handlePhaseEnd();
  }, [clearTimer, handlePhaseEnd]);

  // Update document title
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const label = phase === 'focus' ? 'FOCUS' : phase === 'break' ? 'BREAK' : 'LONG BREAK';
    document.title = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} | ${label}`;
  }, [timeLeft, phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Format time
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const phaseLabel = phase === 'focus' ? '[ FOCUS ]' : phase === 'break' ? '[ BREAK ]' : '[ LONG BREAK ]';

  // Session dots
  const dots = Array.from({ length: settings.sessionsUntilLongBreak }, (_, i) => {
    const isFilled = i < (sessionsCompleted % settings.sessionsUntilLongBreak);
    const isCurrent = !isFilled && i === (sessionsCompleted % settings.sessionsUntilLongBreak);
    return (
      <span
        key={i}
        className={`session-dot ${isFilled ? 'filled' : ''} ${isCurrent ? 'current' : ''}`}
      />
    );
  });

  if (!mounted) return null;

  return (
    <main className="crt-screen" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        {/* Tomato */}
        <PixelTomato status={status} phase={phase} />

        {/* Phase label */}
        <div style={{
          fontSize: '10px',
          color: phase === 'focus' ? '#39ff14' : '#ff6b35',
          textShadow: phase === 'focus' 
            ? '0 0 8px #39ff14' 
            : '0 0 8px #ff6b35',
          letterSpacing: '4px',
        }}>
          {phaseLabel}
        </div>

        {/* Timer display */}
        <div className="pixel-border pixel-border-inner" style={{
          textAlign: 'center',
          padding: '24px 32px',
          minWidth: '280px',
        }}>
          <div className="glow-text" style={{
            fontSize: 'clamp(28px, 8vw, 48px)',
            lineHeight: 1.2,
            letterSpacing: '4px',
          }}>
            {timeString}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <button className="pixel-btn" onClick={toggleTimer} style={{ fontSize: '8px' }}>
            {status === 'running' ? 'PAUSE' : 'START'}
          </button>
          <button className="pixel-btn pixel-btn-accent" onClick={resetTimer} style={{ fontSize: '8px' }}>
            RESET
          </button>
          <button className="pixel-btn pixel-btn-accent" onClick={skipPhase} style={{ fontSize: '8px' }}>
            SKIP
          </button>
        </div>

        {/* Session dots */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
          {dots}
        </div>

        {/* Settings */}
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          sessionsCompleted={sessionsCompleted % settings.sessionsUntilLongBreak}
        />

        {/* Footer */}
        <div style={{
          fontSize: '6px',
          opacity: 0.3,
          marginTop: '20px',
        }}>
          CRT POMODORO v1.0
        </div>
      </div>
    </main>
  );
}
