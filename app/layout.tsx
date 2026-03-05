// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css'; // Make sure you have a globals.css for Tailwind

export const metadata: Metadata = {
  title: 'EVM Arb Ranker Pro',
  description: 'Real-time cross-chain arbitrage scanner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
