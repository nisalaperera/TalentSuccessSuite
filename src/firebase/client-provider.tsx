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
    const collections = ['review_periods', 'performance_cycles', 'goal_plans', 'performance_templates', 'performance_template_sections', 'evaluation_flows', 'eligibility_criteria', 'employees'];
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

        // Performance Templates
        const ptRef1 = doc(collection(firestore, 'performance_templates'));
        batch.set(ptRef1, { name: 'Annual Performance Review', description: 'Standard annual review template.', category: 'Performance', status: 'Active' });

        const ptRef2 = doc(collection(firestore, 'performance_templates'));
        batch.set(ptRef2, { name: 'Employee Engagement Survey', description: 'Quarterly survey for employee feedback.', category: 'Survey', status: 'Active' });

        // Performance Template Sections
        const ptsRef1 = doc(collection(firestore, 'performance_template_sections'));
        batch.set(ptsRef1, { 
            name: 'Performance Goals',
            type: 'Performance Goals',
            performanceTemplateId: ptRef1.id,
            order: 1,
            permissions: [{role: 'Worker', view: true, edit: true}, {role: 'Primary Appraiser', view: true, edit: true}],
            enableSectionRatings: true,
            sectionRatingMandatory: true,
            ratingScale: 5,
            ratingCalculationMethod: 'Manual Rating'
        });

        // Evaluation Flows
        const efRef1 = doc(collection(firestore, 'evaluation_flows'));
        batch.set(efRef1, {
            name: 'Standard Evaluation Flow',
            status: 'Active',
            steps: [
                {id: '1', sequence: 1, task: 'Worker Self-Evaluation', role: 'Primary (Worker)', flowType: 'Start'},
                {id: '2', sequence: 2, task: 'Manager Evaluation', role: 'Secondary (Manager)', flowType: 'Sequential'}
            ]
        });

        // Eligibility Criteria
        const ecRef1 = doc(collection(firestore, 'eligibility_criteria'));
        batch.set(ecRef1, {
            name: 'Standard Employee Eligibility',
            status: 'Active',
            rules: [{id: '1', type: 'Person Type', values: ['Intern', 'Contractor']}]
        });

        // Employees
        const employees = [
            { personNumber: '1001', personEmail: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', designation: 'Software Engineer', personType: 'Full-Time', department: 'Engineering', entity: 'Global Corp', workManager: 'Jane Smith', homeManager: 'Jane Smith' },
            { personNumber: '1002', personEmail: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', designation: 'Engineering Manager', personType: 'Full-Time', department: 'Engineering', entity: 'Global Corp', workManager: 'Alice Johnson', homeManager: 'Alice Johnson' },
            { personNumber: '1003', personEmail: 'peter.jones@example.com', firstName: 'Peter', lastName: 'Jones', designation: 'Sales Associate', personType: 'Part-Time', department: 'Sales', entity: 'US Division', workManager: 'Sam Wilson', homeManager: 'Sam Wilson' },
            { personNumber: '1004', personEmail: 'mary.white@example.com', firstName: 'Mary', lastName: 'White', designation: 'HR Intern', personType: 'Intern', department: 'HR', entity: 'EU Division', workManager: 'Robert Brown', homeManager: 'Robert Brown' },
            { personNumber: '1005', personEmail: 'chris.green@example.com', firstName: 'Chris', lastName: 'Green', designation: 'Marketing Contractor', personType: 'Contractor', department: 'Marketing', entity: 'Global Corp', workManager: 'Patricia Black', homeManager: 'Patricia Black' }
        ];
        employees.forEach(emp => {
            const empRef = doc(collection(firestore, 'employees'));
            batch.set(empRef, emp);
        });

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
