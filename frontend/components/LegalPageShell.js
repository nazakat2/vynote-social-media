'use client';

import { usePathname, useRouter } from 'next/navigation';

const links = [
  ['/about', 'About'],
  ['/terms', 'Terms'],
  ['/privacy', 'Privacy'],
  ['/privacy-choices', 'Privacy Choices'],
];

export default function LegalPageShell({ title, eyebrow = 'VyNote', description, children }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="rn-legal-page">
      <header className="rn-legal-header">
        <button className="rn-legal-brand" onClick={() => router.push('/')} aria-label="Go to VyNote home">
          <span>♥</span> vynote
        </button>
        <nav className="rn-legal-nav" aria-label="Legal pages">
          {links.map(([href, label]) => <a key={href} href={href} className={pathname === href ? 'active' : ''}>{label}</a>)}
        </nav>
        <button className="rn-legal-home" onClick={() => router.push('/')}>Back to app</button>
      </header>

      <main className="rn-legal-main">
        <section className="rn-legal-hero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </section>
        <article className="rn-legal-card">{children}</article>
        <footer className="rn-legal-footer">© 2026 VyNote. All rights reserved.</footer>
      </main>
    </div>
  );
}
