'use client';
export default function LoadingSpinner({ size = 32, color = 'var(--rn-red, #ff2442)', text = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{
          width: size,
          height: size,
          border: `3px solid var(--line, #e5e5e5)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 4,
          border: `2px solid transparent`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 1.2s linear infinite reverse',
          opacity: 0.5,
        }} />
      </div>
      {text && (
        <p style={{
          marginTop: 12,
          fontSize: 13,
          color: 'var(--sub, #888)',
          fontWeight: 500,
        }}>
          {text}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      breakInside: 'avoid',
      marginBottom: 20,
      borderRadius: 12,
      background: 'var(--card-bg, #fff)',
      overflow: 'hidden',
    }}>
      <div style={{
        aspectRatio: '4/5',
        background: 'linear-gradient(90deg, var(--input-bg, #f0f0f0) 25%, var(--line, #e5e5e5) 50%, var(--input-bg, #f0f0f0) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{ padding: '12px 8px' }}>
        <div style={{
          height: 14,
          width: '80%',
          borderRadius: 4,
          background: 'var(--input-bg, #f0f0f0)',
          marginBottom: 8,
        }} />
        <div style={{
          height: 12,
          width: '50%',
          borderRadius: 4,
          background: 'var(--input-bg, #f0f0f0)',
        }} />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function PageLoader() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #fafafa)',
      zIndex: 9999,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: 'linear-gradient(135deg, #ff2442, #ff7a59)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(255,36,66,.4)',
        animation: 'pulse 1.5s ease infinite',
        marginBottom: 16,
      }}>
        <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: '#fff' }}>
          <path d="M12 21c-4.8-3.3-9-6.6-9-10.6C3 7.4 5.2 5.3 7.9 5.3c1.6 0 3.1.8 4.1 2.2 1-1.4 2.5-2.2 4.1-2.2 2.7 0 4.9 2.1 4.9 5.1 0 4-4.2 7.3-9 10.6z" />
        </svg>
      </div>
      <p style={{ fontSize: 14, color: 'var(--sub, #888)', fontWeight: 500 }}>Loading...</p>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
