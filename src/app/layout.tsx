import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApexHack — Ultra Pro Max Enterprise Hackathon Platform',
  description:
    'Professional hackathon discovery, team collaboration, balanced judge assignment, autonomous AI jury, and verifiable certificate ecosystem.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-[#111827] bg-[#FFFFFF] antialiased">
        {children}
      </body>
    </html>
  );
}
