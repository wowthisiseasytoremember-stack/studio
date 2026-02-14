'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextProps {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextProps | null>(null);

export function FirebaseProvider({
  children,
  ...value
}: { children: ReactNode } & FirebaseContextProps) {
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
}

export function useFirebaseApp(): FirebaseApp {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.app;
}

export function useAuth(): Auth {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useAuth must be used within a FirebaseProvider');
    }
    return context.auth;
}

export function useFirestore(): Firestore {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirestore must be used within a FirebaseProvider');
    }
    return context.db;
}
