import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensure NEXT_PUBLIC_KAKAO_API_KEY is the JavaScript Key (not REST API Key)
  const KAKAO_SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&libraries=services,clusterer&autoload=false`;

  return (
    <html lang="ko">
      <head>
        {/* Preload generic styles if needed */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={KAKAO_SDK_URL}
          strategy="beforeInteractive"
        />

        {/* Full width container, remove max-w-md */}
        <div className="w-full min-h-screen bg-background relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
