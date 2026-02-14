'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData, QuerySnapshot } from 'firebase/firestore';

export function useCollection<T extends DocumentData>(q: Query | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (q === null) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(q, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const collectionData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
        setData(collectionData);
        setLoading(false);
        setError(null);
      }, 
      (err: Error) => {
        console.error("useCollection error:", err);
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}
