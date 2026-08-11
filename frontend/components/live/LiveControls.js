'use client';

export default function LiveControls({ cameraEnabled, microphoneEnabled, onToggleCamera, onToggleMicrophone, onSwitchCamera, onEndLive, viewerCount, duration }) {
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0', flexWrap: 'wrap' }}>
      <button onClick={onToggleCamera} title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'} style={{ width: 44, height: 44, borderRadius: '50%', background: cameraEnabled ? 'var(--chip, #f5f5f7)' : 'rgba(239,68,68,.15)', color: cameraEnabled ? 'var(--ink, #222)' : '#ef4444', border: `1px solid ${cameraEnabled ? 'var(--line, #e5e5e5)' : 'rgba(239,68,68,.3)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {cameraEnabled ? '📷' : '🚫'}
      </button>

      <button onClick={onToggleMicrophone} title={microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'} style={{ width: 44, height: 44, borderRadius: '50%', background: microphoneEnabled ? 'var(--chip, #f5f5f7)' : 'rgba(239,68,68,.15)', color: microphoneEnabled ? 'var(--ink, #222)' : '#ef4444', border: `1px solid ${microphoneEnabled ? 'var(--line, #e5e5e5)' : 'rgba(239,68,68,.3)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {microphoneEnabled ? '🎤' : '🔇'}
      </button>

      <button onClick={onSwitchCamera} title="Switch camera" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--chip, #f5f5f7)', color: 'var(--ink, #222)', border: '1px solid var(--line, #e5e5e5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        🔄
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: 'var(--chip, #f5f5f7)' }}>
        <span style={{ fontSize: 13 }}>👁</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink, #222)' }}>{viewerCount}</span>
      </div>

      <div style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--chip, #f5f5f7)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink, #222)' }}>{formatDuration(duration)}</span>
      </div>

      <button onClick={onEndLive} style={{ height: 38, padding: '0 18px', borderRadius: 19, background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', marginLeft: 8 }}>
        End Live
      </button>
    </div>
  );
}
