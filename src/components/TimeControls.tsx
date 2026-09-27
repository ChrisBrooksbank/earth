import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { isMobile } from '../lib/isMobile';
import { formatRate, simClock } from '../lib/simClock';
import { multiplierToSlider, sliderToMultiplier } from '../lib/timeSlider';

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
