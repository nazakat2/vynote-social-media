'use client';
import { useState, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
];

export function useTranslation() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [translating, setTranslating] = useState(false);

  const translate = async (text) => {
    if (!text || sourceLang === targetLang) return text;
    setTranslating(true);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      const translated = data[0].map(s => s[0]).join('');
      setTranslating(false);
      return translated;
    } catch (err) {
      setTranslating(false);
      return text;
    }
  };

  const detectLanguage = async (text) => {
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.slice(0, 200))}`);
      const data = await res.json();
      return data[0][2] || 'en';
    } catch {
      return 'en';
    }
  };

  return { translate, detectLanguage, sourceLang, setSourceLang, targetLang, setTargetLang, translating, languages: LANGUAGES };
}

export default function TranslationModal({ text, onTranslate, onClose }) {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [translated, setTranslated] = useState('');
  const [translating, setTranslating] = useState(false);

  useEffect(() => { if (text) translateText(); }, [text, sourceLang, targetLang]);

  const translateText = async () => {
    if (!text || sourceLang === targetLang) { setTranslated(text); return; }
    setTranslating(true);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      setTranslated(data[0].map(s => s[0]).join(''));
    } catch { setTranslated(text); }
    setTranslating(false);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(500px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: ink, margin: 0 }}>Translate</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 12px', fontSize: 13 }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
            </select>
            <button onClick={() => { setSourceLang(targetLang); setTargetLang(sourceLang); }} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: chip, border: `1px solid ${line}`, cursor: 'pointer', fontSize: 16 }}>⇄</button>
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 12px', fontSize: 13 }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
            </select>
          </div>

          <div style={{ background: chip, borderRadius: 12, padding: 16, marginBottom: 12, minHeight: 80 }}>
            <p style={{ fontSize: 14, color: ink, lineHeight: 1.6, margin: 0 }}>{text}</p>
          </div>

          <div style={{ background: chip, borderRadius: 12, padding: 16, minHeight: 80, border: `1px solid ${line}` }}>
            {translating ? (
              <p style={{ fontSize: 13, color: sub }}>Translating...</p>
            ) : (
              <p style={{ fontSize: 14, color: ink, lineHeight: 1.6, margin: 0 }}>{translated || text}</p>
            )}
          </div>

          <button onClick={() => { onTranslate(translated); onClose(); }} style={{ width: '100%', height: 42, borderRadius: 21, background: '#ff2442', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 16 }}>
            Use Translation
          </button>
        </div>
      </div>
    </div>
  );
}
