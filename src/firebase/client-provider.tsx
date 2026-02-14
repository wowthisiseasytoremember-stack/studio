'use client';

import { useEffect, useState, ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

function isConfigValid(config: object) {
    const hasAllValues = Object.values(config).every(value => !!value);
    return Object.keys(config).length > 0 && hasAllValues;
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigValid(firebaseConfig)) {
        setError("Firebase configuration is missing. I will add it in the next step.");
        return;
    }

    if (typeof window !== 'undefined' && !app) {
        const existingApp = getApps().find(app => app.name === '[DEFAULT]');
        if (existingApp) {
            setApp(existingApp);
        } else {
            setApp(initializeApp(firebaseConfig));
        }
    }
  }, [app]);

  if (error) {
      return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground"><div className="p-4 rounded-md border bg-card text-card-foreground">{error}</div></div>;
  }

  if (!app) {
    return null; // Or a loading spinner
  }

  const auth = getAuth(app);
  const db = getFirestore(app);

  return (
    <FirebaseProvider app={app} auth={auth} db={db}>
      {children}
    </FirebaseProvider>
  );
}
