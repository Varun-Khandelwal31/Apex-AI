import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'APEX AI - The Autonomous Race Engineer',
  description: 'Full-stack F1 telemetry analysis, ML lap mistake detection, and AI race strategy platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-gray-100 antialiased min-h-screen selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
