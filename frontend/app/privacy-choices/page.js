'use client';
import { useState } from 'react';
import LegalPageShell from '../../components/LegalPageShell';

const options = [
  ['analytics', 'Analytics & performance', 'Help us understand reliability and improve the app.'],
  ['personalized', 'Personalized content', 'Use your activity to recommend content relevant to you.'],
  ['marketing', 'Marketing communications', 'Receive occasional product news and promotions.'],
  ['thirdParty', 'Partner personalization', 'Allow eligible partner data to personalize advertising.'],
];

export default function PrivacyChoicesPage() {
  const [choices, setChoices] = useState({ analytics: true, personalized: true, marketing: false, thirdParty: false });
  const [saved, setSaved] = useState(false);
  return <LegalPageShell title="Your Privacy Choices" description="Choose how VyNote uses your data. Essential security and account functions always remain enabled.">
    <div style={{ display: 'grid', gap: 12 }}>
      {options.map(([key, title, description]) => <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '18px 20px', border: '1px solid #ececf0', borderRadius: 16, background: '#fafafd' }}>
        <div><strong style={{ display: 'block', marginBottom: 3 }}>{title}</strong><span style={{ color: '#777780', fontSize: 13 }}>{description}</span></div>
        <button aria-label={`Toggle ${title}`} aria-pressed={choices[key]} onClick={() => { setChoices((old) => ({ ...old, [key]: !old[key] })); setSaved(false); }} style={{ width: 50, height: 28, flexShrink: 0, borderRadius: 15, border: 0, position: 'relative', cursor: 'pointer', background: choices[key] ? '#ff2442' : '#d3d3d9', transition: '.2s' }}><span style={{ position: 'absolute', width: 22, height: 22, left: choices[key] ? 25 : 3, top: 3, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.18)', transition: '.2s' }} /></button>
      </div>)}
    </div>
    <button onClick={() => setSaved(true)} style={{ width: '100%', height: 48, marginTop: 24, border: 0, borderRadius: 24, background: '#ff2442', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,36,66,.2)' }}>{saved ? 'Preferences saved' : 'Save preferences'}</button>
  </LegalPageShell>;
}
