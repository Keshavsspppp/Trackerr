import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/src/components/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

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
        url: '/logo.png', // Fallback to logo or og-image if created
        width: 512,
        height: 512,
        alt: 'Trackerr Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trackerr — Internship Tracker',
    description: 'Track every application, land the internship. Free, no ads, your data.',
    images: ['/logo.png'],
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
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
