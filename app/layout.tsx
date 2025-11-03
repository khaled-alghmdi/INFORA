import type { Metadata } from 'next';
import './globals.css';
import AuthCheck from '@/components/AuthCheck';

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
        <AuthCheck>{children}</AuthCheck>
      </body>
    </html>
  );
}

