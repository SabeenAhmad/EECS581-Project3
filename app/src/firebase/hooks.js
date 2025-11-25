import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics only for web platform
if (Platform.OS === 'web') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    getAnalytics(app);
  }).catch(error => {
    console.log('Analytics initialization failed:', error);
  });
}

/**
 * Hook to get real-time parking lot data
 * @returns {{ lots: Array, loading: boolean, error: Error | null }}
 */
export function useParkingLots() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create a query for the parking lots collection
    const q = query(collection(db, 'lots'));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const lotsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLots(lotsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching parking lots:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { lots, loading, error };
}