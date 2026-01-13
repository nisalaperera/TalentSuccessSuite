'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

const seedData = async (firestore: any) => {
    const collections = ['review_periods', 'performance_cycles', 'goal_plans'];
    let shouldSeed = false;

    for (const coll of collections) {
        const snapshot = await getDocs(collection(firestore, coll));
        if (snapshot.empty) {
            shouldSeed = true;
            break;
        }
    }

    if (shouldSeed) {
        console.log("Seeding initial data...");
        const batch = writeBatch(firestore);

        // Review Periods
        const rpRef1 = doc(collection(firestore, 'review_periods'));
        batch.set(rpRef1, { name: 'FY 2024-25', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), status: 'Active' });
        
        const rpRef2 = doc(collection(firestore, 'review_periods'));
        batch.set(rpRef2, { name: 'FY 2025-26', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), status: 'Active' });

        // Performance Cycles
        const pcRef1 = doc(collection(firestore, 'performance_cycles'));
        batch.set(pcRef1, { name: 'Q1 2024 Check-in', reviewPeriodId: rpRef1.id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31'), status: 'Active' });
        
        const pcRef2 = doc(collection(firestore, 'performance_cycles'));
        batch.set(pcRef2, { name: 'Q2 2024 Check-in', reviewPeriodId: rpRef1.id, startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30'), status: 'Active' });
        
        const pcRef3 = doc(collection(firestore, 'performance_cycles'));
        batch.set(pcRef3, { name: 'Q1 2025 Check-in', reviewPeriodId: rpRef2.id, startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31'), status: 'Active' });

        // Goal Plans
        const gpRef1 = doc(collection(firestore, 'goal_plans'));
        batch.set(gpRef1, { name: 'Q1 2024 Engineering Goals', performanceCycleId: pcRef1.id, status: 'Active' });
        
        const gpRef2 = doc(collection(firestore, 'goal_plans'));
        batch.set(gpRef2, { name: 'Q2 2024 Engineering Goals', performanceCycleId: pcRef2.id, status: 'Active' });

        await batch.commit();
        console.log("Initial data seeded.");
    }
};


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user: User | null) => {
      if (!user) {
        // If no user is signed in, sign them in anonymously.
        signInAnonymously(firebaseServices.auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
        });
      } else {
        // Once we have a user, we can seed the data
        seedData(firebaseServices.firestore);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firebaseServices.auth, firebaseServices.firestore]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
