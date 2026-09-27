import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { simClock } from '../lib/simClock';
import { buildShareUrl, type ShareState } from '../lib/shareLink';

function currentShareState(): ShareState {
  const { cameraMode, selectedBody, pin } = useAppStore.getState();
  const ms = simClock.ms;
  if (cameraMode === 'earthMoonSun') return { view: 'ems', ms };
  if (cameraMode === 'solarSystem' || !selectedBody) return { view: 'solar', ms };
  if (selectedBody === 'Earth') return { view: 'earth', ms, ...(pin ? { pin } : {}) };
  return { view: 'body', body: selectedBody, ms };
}

/** Copies a link to the current view, moment and pin. */
export default function ShareButton({ style }: { style: React.CSSProperties }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = buildShareUrl(currentShareState(), window.location.href);
    window.history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context): the address bar has the link
      window.prompt('Copy this link:', url);
    }
  }

  return (
    <button style={style} onClick={() => void share()} title="Copy a link to this view">
      <span aria-live="polite">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}
