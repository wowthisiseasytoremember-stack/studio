'use client';

import { DatabaseZap, User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';

export function Header() {
  const { user, loading } = useUser();

  return (
    <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <DatabaseZap className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-xl font-bold tracking-tight">
            Insight Store
          </h1>
        </Link>
        <div>
          {loading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            <Avatar className="h-8 w-8">
                <AvatarFallback>
                    <User className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
          ) : null }
        </div>
      </div>
    </header>
  );
}
