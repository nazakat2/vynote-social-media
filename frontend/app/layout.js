import './globals.css';
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  metadataBase: new URL('https://vynote.app'),
  title: {
    default: 'VyNote — Share Your Life',
    template: '%s | VyNote',
  },
  description: 'A social platform to share your moments, discover trends, and connect with creators worldwide.',
  keywords: ['social media', 'photos', 'sharing', 'lifestyle', 'fashion', 'food', 'travel'],
  authors: [{ name: 'VyNote' }],
  creator: 'VyNote',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vynote.app',
    siteName: 'VyNote',
    title: 'VyNote — Share Your Life',
    description: 'A social platform to share your moments, discover trends, and connect with creators worldwide.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VyNote',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VyNote — Share Your Life',
    description: 'A social platform to share your moments, discover trends, and connect with creators worldwide.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ff2442',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body style={{ margin: 0, minHeight: '100vh' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
