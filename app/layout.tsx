import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FORMA — Your imagination. Now executable.',
  description: 'A new way to create, explore and refine parametric architecture with natural language. Join early access.',
  openGraph: { title: 'FORMA — Your imagination. Now executable.', description: 'Parametric design meets conversation.', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
