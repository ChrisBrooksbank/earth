import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { isMobile } from '../lib/isMobile';
import { formatRate, simClock } from '../lib/simClock';

// Slider uses log scale: 0–100 maps to 10^0–10^7.5 simulated seconds per second
// (real time up to about one year per second)
const MAX_LOG_RATE = 7.5;

function sliderToMultiplier(value: number): number {
  const raw = Math.pow(10, (value / 100) * MAX_LOG_RATE);
  // Round to two significant figures so the label reads cleanly
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.max(1, Math.round(raw / magnitude) * magnitude);
}

function multiplierToSlider(multiplier: number): number {
  return (Math.log10(multiplier) / MAX_LOG_RATE) * 100;
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

/** Re-renders a few times per second to show the simulation date. */
function useSimDate(): Date {
  const [date, setDate] = useState(() => new Date(simClock.ms));
  useEffect(() => {
    const id = window.setInterval(() => setDate(new Date(simClock.ms)), 250);
    return () => window.clearInterval(id);
  }, []);
  return date;
}

export default function TimeControls() {
  const { timeMultiplier, isPaused, setTimeMultiplier, togglePause } = useAppStore();
  const simDate = useSimDate();

  const sliderValue = multiplierToSlider(timeMultiplier);

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Number(e.target.value);
    setTimeMultiplier(sliderToMultiplier(raw));
  }

  return (
    <div
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        right: isMobile ? '24px' : 'auto',
        padding: isMobile ? '10px 12px' : '12px 16px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '8px 12px' : '12px',
        userSelect: 'none',
      }}
    >
      <button
        onClick={togglePause}
        aria-label={isPaused ? 'Play' : 'Pause'}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff',
          borderRadius: '4px',
          padding: '4px 10px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        {isPaused ? '▶' : '⏸'}
      </button>
      <input
        type="range"
        aria-label="Simulation speed"
        min={0}
        max={100}
        step={1}
        value={sliderValue}
        onChange={handleSliderChange}
        style={{ width: isMobile ? '100%' : '120px', minWidth: 0, cursor: 'pointer' }}
      />
      <span style={{ minWidth: isMobile ? '64px' : '76px', textAlign: 'right' }}>
        {formatRate(timeMultiplier)}
      </span>
      <span
        data-testid="sim-date"
        style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', fontSize: '12px' }}
      >
        {DATE_FORMAT.format(simDate)}
      </span>
      <button
        onClick={() => {
          simClock.ms = Date.now();
        }}
        title="Jump to the current date and time"
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Now
      </button>
    </div>
  );
}
