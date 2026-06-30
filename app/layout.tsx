import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/src/components/Toast";

export const metadata: Metadata = {
  metadataBase: new URL('https://trackerr-lovat.vercel.app'),
  title: "Trackerr — Internship Tracker",
  description: "Track every application, land the internship. Free, no ads, your data.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/logo.png', sizes: '512x512' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Trackerr — Internship Tracker',
    description: 'Track every application, land the internship. Free, no ads, your data.',
    url: 'https://trackerr-lovat.vercel.app',
    siteName: 'Trackerr',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Trackerr — Internship Tracker',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trackerr — Internship Tracker',
    description: 'Track every application, land the internship. Free, no ads, your data.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://trackerr-lovat.vercel.app',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('trackerr_theme');
                if (theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
