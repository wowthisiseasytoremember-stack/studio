'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // Automatically sign in the user anonymously if not logged in
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            setLoading(false);
        });
      }
    });

    // Handle initial state if auth is already initialized
    if (auth.currentUser) {
        setUser(auth.currentUser);
        setLoading(false);
    }

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
