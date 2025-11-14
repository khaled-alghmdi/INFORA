import type { Metadata } from 'next';
import './globals.css';
import AuthCheck from '@/components/AuthCheck';
import WaveBackground from '@/components/WaveBackground';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'INFORA - IT Device Inventory',
  description: 'IT Device Inventory Management System for Tamer Consumer Company',
  icons: {
    icon: '/Tamer_logo.png',
    shortcut: '/Tamer_logo.png',
    apple: '/Tamer_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <WaveBackground />
          <AuthCheck>{children}</AuthCheck>
        </ThemeProvider>
      </body>
    </html>
  );
}

