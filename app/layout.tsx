import type { Metadata } from 'next';
import './globals.css';
import AuthCheck from '@/components/AuthCheck';
import WaveBackground from '@/components/WaveBackground';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'INFORA - IT Device Inventory',
  description: 'IT Device Inventory Management System for Tamer Consumer Company',
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

