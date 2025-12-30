import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'Seoul Subway Live',
    description: 'Real-time GPS navigation for Seoul Subway',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>
                <Script
                    src="//dapi.kakao.com/v2/maps/sdk.js?appkey=0236cfffa7cfef34abacd91a6d7c73c0&libraries=services,clusterer&autoload=false"
                    strategy="afterInteractive"
                />
                {children}
            </body>
        </html>
    );
}
