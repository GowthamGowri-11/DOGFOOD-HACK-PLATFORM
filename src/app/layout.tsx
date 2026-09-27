import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATLYX — Competition Arena',
  description:
    'Professional hackathon discovery, team collaboration, balanced judge assignment, autonomous AI jury, and verifiable certificate ecosystem on ATLYX.',
  icons: {
    icon: '/atlyx-logo.png',
    apple: '/atlyx-logo.png',
  },
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
