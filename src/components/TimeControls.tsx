import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';

// Slider uses log scale: slider value 0–100 maps to multiplier 1–10000
function sliderToMultiplier(value: number): number {
  return Math.round(Math.pow(10, (value / 100) * 4));
}

function multiplierToSlider(multiplier: number): number {
  return (Math.log10(multiplier) / 4) * 100;
}

export default function TimeControls() {
  const { timeMultiplier, isPaused, setTimeMultiplier, togglePause } = useAppStore();

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
        right: '24px',
        padding: '12px 16px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        userSelect: 'none',
      }}
    >
      <button
        onClick={togglePause}
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
        min={0}
        max={100}
        step={1}
        value={sliderValue}
        onChange={handleSliderChange}
        style={{ width: '120px', cursor: 'pointer' }}
      />
      <span style={{ minWidth: '70px', textAlign: 'right' }}>
        {timeMultiplier >= 10000
          ? '10000×'
          : timeMultiplier >= 1000
            ? `${timeMultiplier}×`
            : `${timeMultiplier}×`}
      </span>
    </div>
  );
}
