import { DatabaseZap } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <DatabaseZap className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-xl font-bold tracking-tight">
            Insight Store
          </h1>
        </Link>
      </div>
    </header>
  );
}
