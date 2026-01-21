
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Link from 'next/link';
import { FirebaseClientProvider } from '@/firebase';
import { Header } from '@/app/components/header';
import { GlobalStateProvider } from '@/app/context/global-state-provider';

export const metadata: Metadata = {
  title: 'Talent Success Suite',
  description: 'Performance Management Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-muted/40">
        <FirebaseClientProvider>
          <GlobalStateProvider>
            <Header />
            {children}
          </GlobalStateProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
