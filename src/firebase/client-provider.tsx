
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';

const seedData = async (firestore: any) => {
    const collectionsToSeed = {
        review_periods: true,
        performance_cycles: true,
        goal_plans: true,
        performance_templates: true,
        performance_template_sections: true,
        evaluation_flows: true,
        eligibility_criteria: true,
        employees: true,
    };

    let shouldSeed = false;
    for (const coll of Object.keys(collectionsToSeed)) {
        try {
            const snapshot = await getDocs(collection(firestore, coll));
            if (snapshot.empty) {
                shouldSeed = true;
                break;
            }
        } catch (error) {
            // If collection doesn't exist, it's a reason to seed.
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

        // Goal Plans
        const gpRef1 = doc(collection(firestore, 'goal_plans'));
        batch.set(gpRef1, { name: 'FY25 Engineering Goals', reviewPeriodId: rpRef1.id, status: 'Active' });
        
        const gpRef2 = doc(collection(firestore, 'goal_plans'));
        batch.set(gpRef2, { name: 'FY26 Engineering Goals', reviewPeriodId: rpRef2.id, status: 'Active' });
        
        const gpRef3 = doc(collection(firestore, 'goal_plans'));
        batch.set(gpRef3, { name: 'FY25 Sales Goals', reviewPeriodId: rpRef1.id, status: 'Active' });

        // Performance Cycles
        const pcRef1 = doc(collection(firestore, 'performance_cycles'));
        batch.set(pcRef1, { name: 'Q1 2024 Check-in', reviewPeriodId: rpRef1.id, goalPlanId: gpRef1.id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31'), status: 'Active' });
        
        const pcRef2 = doc(collection(firestore, 'performance_cycles'));
        batch.set(pcRef2, { name: 'Q2 2024 Check-in', reviewPeriodId: rpRef1.id, goalPlanId: gpRef1.id, startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30'), status: 'Active' });
        
        const pcRef3 = doc(collection(firestore, 'performance_cycles'));
        batch.set(pcRef3, { name: 'Q1 2025 Check-in', reviewPeriodId: rpRef2.id, goalPlanId: gpRef2.id, startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31'), status: 'Active' });

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
            ratingCalculationMethod: 'Manual'
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
        const employeeSnapshot = await getDocs(collection(firestore, 'employees'));
        if (employeeSnapshot.empty) {
            const personTypes = ['Full-Time', 'Part-Time', 'Intern', 'Contractor'];
            const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Delivery', 'AMST-VNL-SBU-Core'];
            const entities = ['Global Corp', 'US Division', 'EU Division'];
            const technologistTypes: ('SENIOR' | 'JUNIOR')[] = ['SENIOR', 'JUNIOR'];
            let personNumberCounter = 1000;
            
            const employeeShells = [];
            
            for (const personType of personTypes) {
                for (const department of departments) {
                    for (const entity of entities) {
                        const personNumber = String(personNumberCounter++);
                        const firstName = `User${personNumber}`;
                        const lastName = `Test`;
                        const technologistType = technologistTypes[Math.floor(Math.random() * technologistTypes.length)];
                        const designationPrefix = technologistType === 'SENIOR' ? 'Sr.' : 'Jr.';

                        employeeShells.push({
                            personNumber,
                            personEmail: `${firstName}.${lastName}@example.com`.toLowerCase(),
                            firstName,
                            lastName,
                            designation: `${designationPrefix} ${department.slice(0, 4)}`,
                            personType,
                            department,
                            entity,
                            workManager: '',
                            homeManager: '',
                            technologist_type: technologistType,
                        });
                    }
                }
            }

            const managerPersonNumbers = employeeShells.map(e => e.personNumber);

            employeeShells.forEach(employee => {
                let workManager = managerPersonNumbers[Math.floor(Math.random() * managerPersonNumbers.length)];
                while (workManager === employee.personNumber) {
                    workManager = managerPersonNumbers[Math.floor(Math.random() * managerPersonNumbers.length)];
                }

                let homeManager = managerPersonNumbers[Math.floor(Math.random() * managerPersonNumbers.length)];
                while (homeManager === employee.personNumber) {
                    homeManager = managerPersonNumbers[Math.floor(Math.random() * managerPersonNumbers.length)];
                }

                employee.workManager = workManager;
                employee.homeManager = homeManager;

                const employeeRef = doc(collection(firestore, 'employees'));
                batch.set(employeeRef, employee);
            });
        }

        await batch.commit();
        console.log("Initial data seeding complete for core entities.");
    }
    
    // Technologist Weights - This block runs independently to ensure weights are always set or updated.
    try {
        const weightsCollectionRef = collection(firestore, 'technologist_weights');
        const updateWeightsBatch = writeBatch(firestore);

        const seniorQuery = query(weightsCollectionRef, where('technologist_type', '==', 'SENIOR'));
        const juniorQuery = query(weightsCollectionRef, where('technologist_type', '==', 'JUNIOR'));

        const [seniorSnapshot, juniorSnapshot] = await Promise.all([getDocs(seniorQuery), getDocs(juniorQuery)]);

        const seniorData = {
            technologist_type: 'SENIOR' as const,
            workGoalWeight: 30,
            homeGoalWeight: 70,
            primaryAppraiser: 'Home Manager' as const,
            secondaryAppraiser: 'Work Manager' as const,
        };
        if (seniorSnapshot.empty) {
            const newSeniorRef = doc(weightsCollectionRef);
            updateWeightsBatch.set(newSeniorRef, seniorData);
        } else {
            updateWeightsBatch.set(seniorSnapshot.docs[0].ref, seniorData);
        }

        const juniorData = {
            technologist_type: 'JUNIOR' as const,
            workGoalWeight: 70,
            homeGoalWeight: 30,
            primaryAppraiser: 'Work Manager' as const,
            secondaryAppraiser: 'Home Manager' as const,
        };
        if (juniorSnapshot.empty) {
            const newJuniorRef = doc(weightsCollectionRef);
            updateWeightsBatch.set(newJuniorRef, juniorData);
        } else {
            updateWeightsBatch.set(juniorSnapshot.docs[0].ref, juniorData);
        }

        await updateWeightsBatch.commit();
        console.log("Technologist weight distribution is up to date.");

    } catch (error) {
        console.error("Error updating technologist weights:", error);
    }


    // This block will run on every load to ensure existing employees have the new fields.
    // It's idempotent because it only updates if the field is missing or incorrect.
    try {
        const employeesCollectionRef = collection(firestore, 'employees');
        const employeeSnapshotForUpdate = await getDocs(employeesCollectionRef);
        if (!employeeSnapshotForUpdate.empty) {
            const updateBatch = writeBatch(firestore);
            const technologistTypes: ('SENIOR' | 'JUNIOR')[] = ['SENIOR', 'JUNIOR'];
            let updatedCount = 0;

            employeeSnapshotForUpdate.forEach(docSnap => {
                const employeeData = docSnap.data();
                const updatePayload: { technologist_type?: 'SENIOR' | 'JUNIOR', designation?: string } = {};
                let needsUpdate = false;

                let currentTechnologistType = employeeData.technologist_type;
                if (currentTechnologistType === undefined) {
                    currentTechnologistType = technologistTypes[Math.floor(Math.random() * technologistTypes.length)];
                    updatePayload.technologist_type = currentTechnologistType;
                    needsUpdate = true;
                }
                
                const designationPrefix = currentTechnologistType === 'SENIOR' ? 'Sr.' : 'Jr.';
                const newDesignation = `${designationPrefix} ${employeeData.department?.slice(0, 4) || ''}`;

                if (employeeData.designation !== newDesignation && employeeData.department) {
                    updatePayload.designation = newDesignation;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    updateBatch.update(docSnap.ref, updatePayload);
                    updatedCount++;
                }
            });

            if (updatedCount > 0) {
                console.log(`Updating ${updatedCount} existing employee(s) with designation and/or technologist_type...`);
                await updateBatch.commit();
                console.log("Employee update complete.");
            }
        }
    } catch (error) {
        console.error("Error during employee data update:", error);
    }
    
    // Seed Goals separately after core data is committed
    try {
        const goalsCollectionRef = collection(firestore, 'goals');
        const goalsSnapshot = await getDocs(goalsCollectionRef);
        if (goalsSnapshot.empty) {
            const allGoalPlansSnapshot = await getDocs(collection(firestore, 'goal_plans'));
            
            if (!allGoalPlansSnapshot.empty) {
                const goalsBatch = writeBatch(firestore);
                console.log("Seeding sample goals...");

                const engineeringGoalPlan = allGoalPlansSnapshot.docs.find(doc => doc.data().name.includes('Engineering'));

                if (engineeringGoalPlan) {
                    // SENIOR Goals
                    goalsBatch.set(doc(goalsCollectionRef), {
                        goalPlanId: engineeringGoalPlan.id,
                        technologist_type: 'SENIOR',
                        name: 'Work: Architect Microservices Platform',
                        description: 'Lead the design and architecture of the new microservices platform.',
                        type: 'Work',
                        weight: 30,
                        status: 'Not Started'
                    });
                    goalsBatch.set(doc(goalsCollectionRef), {
                        goalPlanId: engineeringGoalPlan.id,
                        technologist_type: 'SENIOR',
                        name: 'Home: Publish Tech Blog Post',
                        description: 'Write and publish a technical blog post on a relevant industry topic.',
                        type: 'Home',
                        weight: 70,
                        status: 'Not Started'
                    });

                    // JUNIOR Goals
                     goalsBatch.set(doc(goalsCollectionRef), {
                        goalPlanId: engineeringGoalPlan.id,
                        technologist_type: 'JUNIOR',
                        name: 'Work: Contribute to Team Project',
                        description: 'Successfully contribute to the main team project by completing assigned tickets.',
                        type: 'Work',
                        weight: 70,
                        status: 'Not Started'
                    });
                    goalsBatch.set(doc(goalsCollectionRef), {
                        goalPlanId: engineeringGoalPlan.id,
                        technologist_type: 'JUNIOR',
                        name: 'Home: Onboarding & Training',
                        description: 'Complete all assigned onboarding tasks and training modules.',
                        type: 'Home',
                        weight: 30,
                        status: 'In Progress'
                    });
                }

                await goalsBatch.commit();
                console.log("Sample goals seeded.");
            }
        }
    } catch (error) {
        console.error("Error seeding goals:", error);
    }
};


export function FirebaseClientProvider({ children }: { children: ReactNode}) {
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
