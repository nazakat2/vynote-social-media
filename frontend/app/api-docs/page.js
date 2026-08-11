import Link from 'next/link';
import './api-docs.css';

const groups = [
  {
    title: 'Authentication',
    endpoints: [
      ['POST', '/auth/v1/signup', 'Create an account'],
      ['POST', '/auth/v1/token', 'Sign in with email or OAuth'],
      ['POST', '/auth/v1/logout', 'End the current session'],
    ],
  },
  {
    title: 'Social API',
    endpoints: [
      ['GET', '/rest/v1/profiles', 'Read public profiles'],
      ['GET', '/rest/v1/posts', 'Browse published posts'],
      ['POST', '/rest/v1/posts', 'Create a post (authentication required)'],
      ['GET', '/rest/v1/comments', 'Read post comments'],
      ['POST', '/rest/v1/comments', 'Add a comment (authentication required)'],
      ['GET', '/rest/v1/notifications', 'Read your notifications'],
    ],
  },
  {
    title: 'Messaging & Live',
    endpoints: [
      ['POST', '/rest/v1/rpc/start_conversation', 'Open or create a conversation'],
      ['GET', '/rest/v1/messages', 'Read conversation messages'],
      ['POST', '/rest/v1/messages', 'Send a message'],
      ['GET', '/rest/v1/live_streams', 'List active live streams'],
      ['POST', '/rest/v1/live_streams', 'Start a live stream'],
    ],
  },
];

export const metadata = {
  title: 'API Docs | VyNote',
  description: 'VyNote API reference',
};

export default function ApiDocsPage() {
  return (
    <main className="api-docs-shell">
      <aside className="api-docs-sidebar">
        <Link href="/" className="api-docs-brand">♥ <span>vynote</span></Link>
        <nav>
          <a href="#overview">Overview</a>
          {groups.map((group) => <a href={`#${group.title.toLowerCase().replaceAll(' ', '-')}`} key={group.title}>{group.title}</a>)}
        </nav>
      </aside>

      <article className="api-docs-content">
        <section id="overview" className="api-docs-hero">
          <span className="api-docs-version">API v1</span>
          <h1>VyNote API Documentation</h1>
          <p>Reference for the Supabase APIs used by the VyNote web application.</p>
          <div className="api-docs-base"><strong>Base URL</strong><code>https://kxqyplgmdzwynnqbncqf.supabase.co</code></div>
          <p className="api-docs-note">Protected requests require an <code>Authorization: Bearer &lt;access_token&gt;</code> header and the project API key. Row Level Security controls access to user data.</p>
        </section>

        {groups.map((group) => (
          <section className="api-docs-group" id={group.title.toLowerCase().replaceAll(' ', '-')} key={group.title}>
            <h2>{group.title}</h2>
            <div className="api-docs-list">
              {group.endpoints.map(([method, path, description]) => (
                <div className="api-docs-endpoint" key={`${method}-${path}`}>
                  <span className={`api-method api-method-${method.toLowerCase()}`}>{method}</span>
                  <code>{path}</code>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </article>
    </main>
  );
}
