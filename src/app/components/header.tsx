
'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith('/admin') || pathname.startsWith('/configuration');

  if (pathname === '/') {
    return null; // No header on the main landing page
  }

  return (
    <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <Link href="/">
            <h1 className="text-2xl font-headline font-bold text-primary hover:text-primary/90">
              Talent Suite
            </h1>
          </Link>
          {isAdminSection && (
             <p className="text-sm text-foreground/80 font-body hidden sm:block">
                Seamless Performance Management Configuration
              </p>
          )}
        </div>
      </div>
    </header>
  );
}
