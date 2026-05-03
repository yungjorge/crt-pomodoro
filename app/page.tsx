'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ==================== TYPES ====================
type TimerPhase = 'focus' | 'break' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';
type ThemeId = 'crt-retro' | 'old-mac' | 'digital-clock' | 'windows-xp' | 'cyberpunk' | 'modern-sleek' | 'asian-ninja';
type ColorMode = 'dark' | 'light';

interface Settings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface ThemeMeta {
  id: ThemeId;
  label: string;
  emoji: string;
}

// ==================== CONSTANTS ====================
const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

const THEMES: ThemeMeta[] = [
  { id: 'crt-retro', label: 'CRT Retro', emoji: '📺' },
  { id: 'old-mac', label: 'Old Mac', emoji: '🖥️' },
  { id: 'digital-clock', label: 'Digital', emoji: '⏰' },
  { id: 'windows-xp', label: 'Win XP', emoji: '🪟' },
  { id: 'cyberpunk', label: 'Cyberpunk', emoji: '🌆' },
  { id: 'modern-sleek', label: 'Modern', emoji: '✨' },
  { id: 'asian-ninja', label: 'Ninja', emoji: '🥷' },
];

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
  } catch { /* Audio not available */ }
}

function playTick() { playBeep(800, 0.05, 'square', 0.03); }
function playPhaseComplete() {
  setTimeout(() => playBeep(523, 0.15, 'square', 0.1), 0);
  setTimeout(() => playBeep(659, 0.15, 'square', 0.1), 150);
  setTimeout(() => playBeep(784, 0.2, 'square', 0.1), 300);
}
function playClick() { playBeep(200, 0.03, 'square', 0.05); }

// ==================== THEME MASCOT ART ====================
function Mascot({ status, theme }: { status: TimerStatus; theme: ThemeId }) {
  const running = status === 'running';
  const ended = status === 'idle' && false; // handled via status
  const animClass = running ? 'mascot-running' : '';

  const w = 64, h = 64;

  // Shared wrapper
  const wrap = (children: React.ReactNode, extraClass = '') => (
    <div className={`${animClass} ${extraClass}`.trim()} style={{ imageRendering: 'pixelated', display: 'inline-block' }}>
      {children}
    </div>
  );

  switch (theme) {
    // ─── CRT Retro: Old TV with rabbit ears ───
    case 'crt-retro':
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          {/* Rabbit ears */}
          <rect x="5" y="0" width="1" height="3" fill="#888" />
          <rect x="10" y="0" width="1" height="3" fill="#888" />
          <rect x="4" y="3" width="1" height="1" fill="#888" />
          <rect x="11" y="3" width="1" height="1" fill="#888" />
          {/* TV body */}
          <rect x="3" y="4" width="10" height="7" fill="#333" />
          <rect x="2" y="3" width="12" height="8" fill="#555" />
          <rect x="3" y="4" width="10" height="7" fill="#39ff14" opacity="0.15" />
          {/* Screen inner glow */}
          <rect x="4" y="5" width="8" height="5" fill="#39ff14" opacity="0.3" />
          <rect x="5" y="6" width="6" height="3" fill="#0a0a0a" />
          {/* Screen content (blinking cursor) */}
          <rect x="7" y="7" width="2" height="1" fill="#39ff14" />
          {/* Legs */}
          <rect x="4" y="11" width="2" height="2" fill="#555" />
          <rect x="10" y="11" width="2" height="2" fill="#555" />
          {/* Power light */}
          <rect x="12" y="9" width="1" height="1" fill="#39ff14" />
        </svg>
      );

    // ─── Old Mac: Classic Macintosh ───
    case 'old-mac':
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          {/* Body - all-in-one Mac shape */}
          <rect x="3" y="0" width="10" height="9" fill="#c0c0c0" />
          <rect x="2" y="1" width="12" height="8" fill="#d4d4d4" />
          {/* Screen bezel */}
          <rect x="3" y="2" width="10" height="7" fill="#333" />
          {/* Screen */}
          <rect x="4" y="3" width="8" height="5" fill="#ffffff" />
          {/* Happy Mac face on screen */}
          <rect x="6" y="4" width="1" height="1" fill="#000" />
          <rect x="9" y="4" width="1" height="1" fill="#000" />
          <rect x="6" y="6" width="4" height="1" fill="#000" />
          <rect x="7" y="5" width="2" height="1" fill="#000" />
          {/* Floppy slot */}
          <rect x="5" y="7" width="6" height="1" fill="#888" />
          {/* Base / chin */}
          <rect x="3" y="9" width="10" height="3" fill="#b0b0b0" />
          <rect x="2" y="9" width="12" height="3" fill="#c0c0c0" />
          {/* Apple logo */}
          <rect x="7" y="10" width="2" height="1" fill="#333" />
          {/* Rainbow stripe */}
          <rect x="2" y="12" width="2" height="1" fill="#ff4444" />
          <rect x="4" y="12" width="2" height="1" fill="#ffaa00" />
          <rect x="6" y="12" width="2" height="1" fill="#44ff44" />
          <rect x="8" y="12" width="2" height="1" fill="#4444ff" />
          <rect x="10" y="12" width="2" height="1" fill="#aa44ff" />
          <rect x="12" y="12" width="2" height="1" fill="#ff44ff" />
        </svg>
      );

    // ─── Digital Clock: Alarm clock with bells ───
    case 'digital-clock':
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          {/* Bell left */}
          <rect x="2" y="0" width="3" height="3" fill="#cc0000" />
          <rect x="3" y="0" width="1" height="4" fill="#ff0000" />
          {/* Bell right */}
          <rect x="11" y="0" width="3" height="3" fill="#cc0000" />
          <rect x="12" y="0" width="1" height="4" fill="#ff0000" />
          {/* Hammer */}
          <rect x="6" y="0" width="4" height="2" fill="#ff4444" />
          {/* Clock body */}
          <rect x="3" y="3" width="10" height="8" fill="#1a1a1a" />
          <rect x="2" y="4" width="12" height="7" fill="#2a2a2a" />
          {/* Screen */}
          <rect x="4" y="4" width="8" height="5" fill="#000000" />
          {/* Time display */}
          <rect x="5" y="5" width="2" height="3" fill="#ff0000" opacity="0.8" />
          <rect x="8" y="5" width="2" height="3" fill="#ff0000" opacity="0.8" />
          <rect x="6" y="7" width="1" height="1" fill="#ff0000" opacity="0.8" />
          {/* Colon */}
          <rect x="7" y="5" width="1" height="1" fill="#ff0000" />
          <rect x="7" y="7" width="1" height="1" fill="#ff0000" />
          {/* Legs */}
          <rect x="5" y="11" width="2" height="2" fill="#333" />
          <rect x="9" y="11" width="2" height="2" fill="#333" />
          {/* Bottom bar */}
          <rect x="4" y="10" width="8" height="1" fill="#444" />
        </svg>
      );

    // ─── Windows XP: Classic Window logo ───
    case 'windows-xp':
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          {/* Window pane 1 - red */}
          <rect x="2" y="2" width="5" height="5" fill="#ff4444" rx="1" />
          {/* Window pane 2 - green */}
          <rect x="9" y="2" width="5" height="5" fill="#44cc44" rx="1" />
          {/* Window pane 3 - blue */}
          <rect x="2" y="9" width="5" height="5" fill="#4488ff" rx="1" />
          {/* Window pane 4 - yellow */}
          <rect x="9" y="9" width="5" height="5" fill="#ffcc00" rx="1" />
          {/* Inner highlights */}
          <rect x="3" y="3" width="3" height="3" fill="#fff" opacity="0.3" />
          <rect x="10" y="3" width="3" height="3" fill="#fff" opacity="0.3" />
          <rect x="3" y="10" width="3" height="3" fill="#fff" opacity="0.3" />
          <rect x="10" y="10" width="3" height="3" fill="#fff" opacity="0.3" />
        </svg>
      );

    // ─── Cyberpunk: Neon katana blade ───
    case 'cyberpunk':
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className={running ? 'katana-running' : ''}>
          {/* Blade */}
          <rect x="2" y="6" width="12" height="2" fill="#00ffff" />
          <rect x="2" y="5" width="14" height="1" fill="#ff00ff" opacity="0.6" />
          <rect x="2" y="8" width="14" height="1" fill="#ff00ff" opacity="0.6" />
          {/* Blade edge highlight */}
          <rect x="3" y="6" width="10" height="1" fill="#fff" opacity="0.3" />
          {/* Blade tip */}
          <rect x="14" y="6" width="2" height="2" fill="#00ffff" />
          <rect x="15" y="7" width="1" height="1" fill="#ff00ff" />
          {/* Tsuba (guard) */}
          <rect x="0" y="4" width="2" height="6" fill="#ff00ff" />
          <rect x="0" y="3" width="3" height="1" fill="#ff66ff" />
          <rect x="0" y="10" width="3" height="1" fill="#ff66ff" />
          {/* Tsuka (handle) */}
          <rect x="0" y="11" width="2" height="3" fill="#222" />
          {/* Handle wrap */}
          <rect x="0" y="11" width="2" height="1" fill="#00ffff" opacity="0.5" />
          <rect x="0" y="13" width="2" height="1" fill="#00ffff" opacity="0.5" />
          {/* Pommel */}
          <rect x="0" y="14" width="2" height="1" fill="#ff00ff" />
        </svg>,
        ''
      );

    // ─── Modern Sleek: Minimal geometric circle ───
    case 'modern-sleek': {
      const p = 'var(--primary)';
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          {/* Outer ring */}
          <rect x="1" y="1" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="7" y="1" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="13" y="1" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="1" y="7" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="13" y="7" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="1" y="13" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="7" y="13" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="13" y="13" width="2" height="2" rx="1" fill={p} opacity="0.3" />
          <rect x="3" y="1" width="10" height="1" fill={p} opacity="0.2" />
          <rect x="3" y="14" width="10" height="1" fill={p} opacity="0.2" />
          <rect x="1" y="3" width="1" height="10" fill={p} opacity="0.2" />
          <rect x="14" y="3" width="1" height="10" fill={p} opacity="0.2" />
          {/* Inner play button / pomodoro circle */}
          <rect x="5" y="5" width="6" height="6" rx="3" fill={p} opacity="0.15" />
          {/* Play button triangle */}
          <rect x="7" y="6" width="1" height="4" fill={p} opacity="0.7" />
          <rect x="8" y="7" width="1" height="2" fill={p} opacity="0.7" />
        </svg>
      );
    }

    // ─── Asian Ninja: Ninja with shuriken + sakura ───
    case 'asian-ninja':
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className={running ? 'ninja-running' : ''}>
          {/* Head wrap (zukin) */}
          <rect x="5" y="1" width="6" height="5" fill="#1a1a2e" />
          {/* Face mask slit */}
          <rect x="6" y="3" width="4" height="2" fill="#2d2d4a" />
          {/* Eyes */}
          <rect x="6" y="3" width="1" height="1" fill="#ffffff" />
          <rect x="9" y="3" width="1" height="1" fill="#ffffff" />
          {/* Pupils */}
          <rect x="6" y="3" width="1" height="1" fill="#ff0000" opacity="0.7" />
          <rect x="9" y="3" width="1" height="1" fill="#ff0000" opacity="0.7" />
          {/* Headband */}
          <rect x="5" y="2" width="6" height="1" fill="#ee4266" />
          {/* Headband tails */}
          <rect x="10" y="2" width="2" height="1" fill="#ee4266" />
          <rect x="11" y="3" width="1" height="2" fill="#ee4266" />
          {/* Body */}
          <rect x="5" y="6" width="6" height="5" fill="#1a1a2e" />
          {/* Belt/obi */}
          <rect x="5" y="8" width="6" height="1" fill="#ffd700" />
          {/* Left arm (throwing pose) */}
          <rect x="2" y="6" width="3" height="2" fill="#1a1a2e" />
          <rect x="1" y="7" width="2" height="1" fill="#2d2d4a" />
          {/* Right arm */}
          <rect x="11" y="6" width="3" height="2" fill="#1a1a2e" />
          {/* Shuriken in right hand */}
          <rect x="13" y="5" width="2" height="2" fill="#ffd700" />
          <rect x="14" y="4" width="2" height="1" fill="#ffd700" />
          <rect x="14" y="7" width="2" height="1" fill="#ffd700" />
          <rect x="15" y="3" width="1" height="2" fill="#ffd700" />
          <rect x="15" y="7" width="1" height="2" fill="#ffd700" />
          {/* Legs */}
          <rect x="6" y="11" width="2" height="4" fill="#1a1a2e" />
          <rect x="8" y="11" width="2" height="4" fill="#1a1a2e" />
          {/* Tabi boots */}
          <rect x="6" y="14" width="2" height="2" fill="#333" />
          <rect x="8" y="14" width="2" height="2" fill="#333" />
          {/* Sakura petals floating */}
          <rect x="0" y="0" width="2" height="2" fill="#ffb7c5" opacity="0.6" />
          <rect x="13" y="0" width="1" height="1" fill="#ffb7c5" opacity="0.4" />
          <rect x="2" y="12" width="1" height="1" fill="#ffb7c5" opacity="0.5" />
          <rect x="14" y="13" width="2" height="2" fill="#ffb7c5" opacity="0.3" />
        </svg>,
        ''
      );

    default:
      return wrap(
        <svg width={w} height={h} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="8" height="8" fill="var(--primary)" />
        </svg>
      );
  }
}

// ==================== SAKURA PARTICLES (Ninja theme) ====================
function SakuraParticles({ theme, running }: { theme: ThemeId; running: boolean }) {
  if (theme !== 'asian-ninja' || !running) return null;
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="sakura-particle"
          style={{
            left: `${10 + i * 16}%`,
            top: `${-5 + (i % 3) * 8}px`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + (i % 3) * 0.5}s`,
            fontSize: '8px',
          }}
        >
          🌸
        </span>
      ))}
    </>
  );
}

// ==================== THEME PICKER ====================
function ThemePicker({
  theme,
  mode,
  onThemeChange,
  onModeToggle,
}: {
  theme: ThemeId;
  mode: ColorMode;
  onThemeChange: (t: ThemeId) => void;
  onModeToggle: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '16px' }}>
      <button
        className="pixel-btn"
        onClick={() => { setOpen(!open); playClick(); }}
        style={{ fontSize: 'var(--font-size-xs)', gap: '8px' }}
      >
        🎨 THEMES
      </button>

      {open && (
        <div
          className="pixel-border pixel-border-inner"
          style={{
            marginTop: '12px',
            fontSize: 'var(--font-size-xs)',
            padding: '16px',
          }}
        >
          {/* Light / Dark toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '2px solid var(--border-color)',
          }}>
            <span style={{ color: 'var(--text)' }}>
              {mode === 'dark' ? '🌙 DARK' : '☀️ LIGHT'}
            </span>
            <button
              className={`mode-toggle ${mode}`}
              onClick={() => { onModeToggle(); playClick(); }}
              title="Toggle light/dark mode"
            />
          </div>

          {/* Theme cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '8px',
          }}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-card ${theme === t.id ? 'active' : ''}`}
                onClick={() => { onThemeChange(t.id); playClick(); }}
              >
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{t.emoji}</div>
                <div>{t.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
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
    const maxVal = key === 'focusDuration' ? 60 : key === 'sessionsUntilLongBreak' ? 10 : 30;
    const newVal = Math.max(1, Math.min(maxVal, settings[key] + delta));
    playClick();
    onSettingsChange({ ...settings, [key]: newVal });
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <button
        className="pixel-btn"
        onClick={() => { setOpen(!open); playClick(); }}
        style={{ fontSize: 'var(--font-size-xs)' }}
      >
        ⚙️ SETTINGS
      </button>

      {open && (
        <div
          className="pixel-border pixel-border-inner"
          style={{ marginTop: '12px', fontSize: 'var(--font-size-sm)' }}
        >
          <Row label="FOCUS (min)" value={settings.focusDuration} onMinus={() => update('focusDuration', -1)} onPlus={() => update('focusDuration', 1)} />
          <Row label="BREAK (min)" value={settings.breakDuration} onMinus={() => update('breakDuration', -1)} onPlus={() => update('breakDuration', 1)} />
          <Row label="LONG BREAK" value={settings.longBreakDuration} onMinus={() => update('longBreakDuration', -1)} onPlus={() => update('longBreakDuration', 1)} />
          <Row label="SESSIONS/ROUND" value={settings.sessionsUntilLongBreak} onMinus={() => update('sessionsUntilLongBreak', -1)} onPlus={() => update('sessionsUntilLongBreak', 1)} />

          <div style={{ marginTop: '10px', textAlign: 'center', color: 'var(--accent)' }}>
            SESSION {sessionsCompleted + 1} / {settings.sessionsUntilLongBreak}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ color: 'var(--text)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button className="pixel-btn" onClick={onMinus} style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}>-</button>
        <span style={{ minWidth: '30px', textAlign: 'center', color: 'var(--text)' }}>{value}</span>
        <button className="pixel-btn" onClick={onPlus} style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}>+</button>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function Home() {
  // Timer state
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Theme state
  const [theme, setTheme] = useState<ThemeId>('crt-retro');
  const [mode, setMode] = useState<ColorMode>('dark');

  const [mounted, setMounted] = useState(false);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(-1);

  // ---- Load from localStorage ----
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('crt-pomodoro-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setTimeLeft(parsed.focusDuration * 60);
      }

      const savedTheme = localStorage.getItem('crt-pomodoro-theme');
      if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
        setTheme(savedTheme as ThemeId);
      }

      const savedMode = localStorage.getItem('crt-pomodoro-mode');
      if (savedMode === 'light' || savedMode === 'dark') {
        setMode(savedMode);
      }
    } catch {}
    setMounted(true);
  }, []);

  // ---- Apply theme to DOM ----
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
  }, [theme, mode]);

  // ---- Persist ----
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crt-pomodoro-settings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crt-pomodoro-theme', theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crt-pomodoro-mode', mode);
    }
  }, [mode, mounted]);

  // ---- Timer logic ----
  const getPhaseDuration = useCallback((p: TimerPhase): number => {
    switch (p) {
      case 'focus': return settings.focusDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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
      setPhase('focus');
      setTimeLeft(settings.focusDuration * 60);
    }
  }, [phase, sessionsCompleted, settings]);

  const startTimer = useCallback(() => {
    clearTimer();
    const now = Date.now();
    endTimeRef.current = now + timeLeft * 1000;
    lastSecondRef.current = Math.floor(timeLeft);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(((endTimeRef.current || now) - Date.now()) / 1000));
      setTimeLeft(remaining);

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
  }, [timeLeft, clearTimer, handlePhaseEnd]);

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

  const resetTimer = useCallback(() => {
    playClick();
    clearTimer();
    setStatus('idle');
    setTimeLeft(getPhaseDuration(phase));
    endTimeRef.current = null;
    lastSecondRef.current = -1;
  }, [clearTimer, phase, getPhaseDuration]);

  const skipPhase = useCallback(() => {
    playClick();
    clearTimer();
    endTimeRef.current = null;
    lastSecondRef.current = -1;
    handlePhaseEnd();
  }, [clearTimer, handlePhaseEnd]);

  // ---- Document title ----
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const label = phase === 'focus' ? 'FOCUS' : phase === 'break' ? 'BREAK' : 'LONG BREAK';
    document.title = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} | ${label}`;
  }, [timeLeft, phase]);

  // ---- Cleanup ----
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // ---- Derived values ----
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const phaseLabel = phase === 'focus' ? 'FOCUS' : phase === 'break' ? 'BREAK' : 'LONG BREAK';
  const phaseLabelColor = phase === 'focus' ? 'var(--primary)' : 'var(--accent)';

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

  const isRunning = status === 'running';

  if (!mounted) return null;

  return (
    <>
      {/* Vignette overlay */}
      <div className="vignette-layer" />

      {/* Sakura particles (ninja theme only) */}
      <SakuraParticles theme={theme} running={isRunning} />

      {/* Main content */}
      <main
        className="main-screen"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'var(--bg)',
          transition: 'background-color 0.3s ease',
        }}
      >
        <div style={{
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          {/* Theme Mascot */}
          <Mascot status={status} theme={theme} />

          {/* Phase label */}
          <div style={{
            fontSize: 'var(--font-size-md)',
            color: phaseLabelColor,
            textShadow: `0 0 8px ${phaseLabelColor}`,
            letterSpacing: 'var(--letter-spacing)',
          }}>
            [ {phaseLabel} ]
          </div>

          {/* Timer display */}
          <div className="pixel-border pixel-border-inner" style={{
            textAlign: 'center',
            padding: '24px 32px',
            minWidth: '280px',
          }}>
            <div className="glow-text" style={{
              fontSize: 'clamp(var(--font-size-lg), 8vw, var(--font-size-xl))',
              lineHeight: 1.2,
              letterSpacing: 'var(--timer-letter-spacing)',
              color: 'var(--text)',
              textShadow: 'var(--text-shadow)',
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
            <button className="pixel-btn" onClick={toggleTimer} style={{ fontSize: 'var(--font-size-sm)' }}>
              {isRunning ? 'PAUSE' : 'START'}
            </button>
            <button className="pixel-btn pixel-btn-accent" onClick={resetTimer} style={{ fontSize: 'var(--font-size-sm)' }}>
              RESET
            </button>
            <button className="pixel-btn pixel-btn-accent" onClick={skipPhase} style={{ fontSize: 'var(--font-size-sm)' }}>
              SKIP
            </button>
          </div>

          {/* Session dots */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
            {dots}
          </div>

          {/* Settings panel */}
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            sessionsCompleted={sessionsCompleted % settings.sessionsUntilLongBreak}
          />

          {/* Theme picker */}
          <ThemePicker
            theme={theme}
            mode={mode}
            onThemeChange={setTheme}
            onModeToggle={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
          />

          {/* Footer */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            marginTop: '20px',
          }}>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              opacity: 'var(--opacity-dim)',
              color: 'var(--text)',
            }}>
              for jabbawockee only
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
