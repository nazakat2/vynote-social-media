'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVerification() {
  const [verifiedUsers, setVerifiedUsers] = useState(new Set());

  const checkVerified = async (userId) => {
    const { data } = await supabase.from('profiles').select('is_verified').eq('id', userId).single();
    return data?.is_verified || false;
  };

  const requestVerification = async (userId, reason) => {
    const { error } = await supabase.from('verification_requests').insert({
      user_id: userId,
      reason: reason,
      status: 'pending'
    });
    return { error };
  };

  const approveVerification = async (userId) => {
    await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
    await supabase.from('verification_requests').update({ status: 'approved' }).eq('user_id', userId);
  };

  return { checkVerified, requestVerification, approveVerification, verifiedUsers };
}

export function BlueTick({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#1DA1F2"/>
      <path d="M9.5 16.5L4.5 11.5L6.5 9.5L9.5 12.5L17.5 4.5L19.5 6.5L9.5 16.5Z" fill="white"/>
    </svg>
  );
}

export default function VerificationModal({ onClose, addToast }) {
  const [user, setUser] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleSubmit = async () => {
    if (!reason.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('verification_requests').insert({
      user_id: user.id,
      reason: reason,
      status: 'pending'
    });
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
      addToast?.('Verification request submitted!');
    }
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: ink, margin: 0 }}>Get Verified</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>
        <div style={{ padding: 20 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: ink, marginBottom: 8 }}>Request Submitted</h3>
              <p style={{ fontSize: 13, color: sub }}>We'll review your request within 24-48 hours.</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <BlueTick size={48} />
                <p style={{ fontSize: 14, color: sub, marginTop: 8, lineHeight: 1.5 }}>Get a blue verification badge to show you're a notable person, brand, or organization.</p>
              </div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Why should you be verified? (e.g., public figure, brand, journalist...)" style={{ width: '100%', borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '10px 14px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }} />
              <button onClick={handleSubmit} disabled={!reason.trim() || submitting} style={{ width: '100%', height: 44, borderRadius: 22, background: reason.trim() ? '#1DA1F2' : chip, color: reason.trim() ? '#fff' : sub, fontWeight: 700, fontSize: 15, border: 'none', cursor: reason.trim() ? 'pointer' : 'not-allowed' }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
