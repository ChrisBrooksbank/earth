import { useState } from 'react';
import { useSimTime } from '../hooks/useSimTime';
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

const BUTTON_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.25)',
  color: '#fff',
  borderRadius: '4px',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '12px',
};

/** Format a timestamp for a datetime-local input, in UTC. */
function toUtcInputValue(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16);
}

export default function TimeControls() {
  const {
    timeMultiplier,
    timeDirection,
    isPaused,
    setTimeMultiplier,
    togglePause,
    toggleTimeDirection,
  } = useAppStore();
  const simDate = new Date(useSimTime());
  const [editingDate, setEditingDate] = useState(false);
  const reversed = timeDirection === -1;

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
        {reversed ? '−' : ''}
        {formatRate(timeMultiplier)}
      </span>
      <button
        onClick={toggleTimeDirection}
        aria-label={reversed ? 'Run time forward' : 'Run time backward'}
        aria-pressed={reversed}
        title={reversed ? 'Time is running backward' : 'Run time backward'}
        style={{
          ...BUTTON_STYLE,
          background: reversed ? 'rgba(120,170,255,0.45)' : BUTTON_STYLE.background,
        }}
      >
        ⇆
      </button>
      {editingDate ? (
        <input
          type="datetime-local"
          aria-label="Simulation date and time (UTC)"
          autoFocus
          defaultValue={toUtcInputValue(simDate.getTime())}
          onChange={e => {
            const ms = Date.parse(`${e.target.value}Z`);
            if (Number.isFinite(ms)) simClock.ms = ms;
          }}
          onBlur={() => setEditingDate(false)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === 'Escape') setEditingDate(false);
          }}
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '12px',
            colorScheme: 'dark',
          }}
        />
      ) : (
        <button
          data-testid="sim-date"
          onClick={() => setEditingDate(true)}
          title="Set the simulation date and time"
          style={{
            ...BUTTON_STYLE,
            background: 'transparent',
            border: '1px solid transparent',
            color: 'rgba(255,255,255,0.75)',
            whiteSpace: 'nowrap',
          }}
        >
          {DATE_FORMAT.format(simDate)}
        </button>
      )}
      <button
        onClick={() => {
          simClock.ms = Date.now();
        }}
        title="Jump to the current date and time"
        style={BUTTON_STYLE}
      >
        Now
      </button>
    </div>
  );
}
