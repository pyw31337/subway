import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Seoul Subway Live',
  description: 'Real-time GPS navigation for Seoul Subway',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Preload generic styles if needed */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=3bd7b4c9244a56511fd768a4bba6d71f&libraries=services,clusterer&autoload=false`}
          strategy="beforeInteractive"
        />
        {/* Full width container */}
        <div className="w-full min-h-screen bg-background relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
