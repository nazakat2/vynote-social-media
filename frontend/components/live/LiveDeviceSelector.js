'use client';

export default function LiveDeviceSelector({ cameras, microphones, selectedCamera, selectedMicrophone, onSelectCamera, onSelectMicrophone }) {
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  const selectStyle = { flex: 1, height: 36, borderRadius: 8, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 10px', fontSize: 12, boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {cameras.length > 1 && (
        <select value={selectedCamera} onChange={(e) => onSelectCamera(e.target.value)} style={selectStyle}>
          {cameras.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 4)}`}</option>
          ))}
        </select>
      )}
      {microphones.length > 1 && (
        <select value={selectedMicrophone} onChange={(e) => onSelectMicrophone(e.target.value)} style={selectStyle}>
          {microphones.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 4)}`}</option>
          ))}
        </select>
      )}
    </div>
  );
}
