/**
 * =====================================================
 * КОРНЕВОЙ LAYOUT ДЛЯ AR-КВЕСТА
 * =====================================================
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// =====================================================
// МЕТАДАННЫЕ ДЛЯ SEO И SHARING
// =====================================================

export const metadata: Metadata = {
  title: "AR-Квест | СеваПарк",
  description: "Увлекательный AR-квест в парке развлечений! Найдите тайные метки, разгадайте загадки и получите скидку.",
  keywords: ["AR", "квест", "парк", "дополненная реальность", "игра", "СеваПарк"],
  authors: [{ name: "СеваПарк" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "AR-Квест | СеваПарк",
    description: "Увлекательный AR-квест в парке развлечений!",
    type: "website",
  },
  // Разрешаем доступ к камере
  permissionsPolicy: {
    camera: ['*'],
  },
};

// =====================================================
// VIEWPORT ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ
// =====================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#15803d', // green-700
};

// =====================================================
// КОРНЕВОЙ КОМПОНЕНТ
// =====================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Предзагрузка критичных ресурсов */}
        <link rel="preconnect" href="https://aframe.io" />
        <link rel="preconnect" href="https://raw.githack.com" />
        
        {/* Мета-теги для мобильных AR */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AR Квест" />
        
        {/* Разрешение на камеру для iOS */}
        <meta name="apple-itunes-app" content="app-id=..." />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white overflow-hidden`}
        style={{ 
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </body>
    </html>
  );
}
