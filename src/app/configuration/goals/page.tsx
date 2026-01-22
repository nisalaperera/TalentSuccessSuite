
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { Goal, GoalPlan, Employee } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';

const GOAL_STATUSES: Goal['status'][] = ['Not Started', 'In Progress', 'Completed'];

function GoalsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data fetching
    const goalsQuery = useMemoFirebase(() => collection(firestore, 'goals'), [firestore]);
    const { data: goals } = useCollection<Goal>(goalsQuery);
    
    const goalPlansQuery = useMemoFirebase(() => collection(firestore, 'goal_plans'), [firestore]);
    const { data: goalPlans } = useCollection<GoalPlan>(goalPlansQuery);

    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);

    // Dialog and form state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goalPlanId, setGoalPlanId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [type, setType] = useState<'Work' | 'Home' | undefined>();
    const [weight, setWeight] = useState<number | undefined>();
    const [status, setStatus] = useState<Goal['status'] | undefined>();

    const filterGoalPlanId = searchParams.get('goalPlanId') || '';
    const filterEmployeeId = searchParams.get('employeeId') || '';

    useEffect(() => {
        if (editingGoal) {
            setName(editingGoal.name);
            setDescription(editingGoal.description);
            setGoalPlanId(editingGoal.goalPlanId);
            setEmployeeId(editingGoal.employeeId);
            setType(editingGoal.type);
            setWeight(editingGoal.weight);
            setStatus(editingGoal.status);
        } else {
            setName('');
            setDescription('');
            setGoalPlanId(filterGoalPlanId);
            setEmployeeId(filterEmployeeId);
            setType(undefined);
            setWeight(undefined);
            setStatus('Not Started');
        }
    }, [editingGoal, filterGoalPlanId, filterEmployeeId]);

    const handleOpenDialog = (goal: Goal | null = null) => {
        setEditingGoal(goal);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingGoal(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!name || !goalPlanId || !employeeId || !type || !status) {
            toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive" });
            return;
        }

        const goalData: Omit<Goal, 'id'> = {
            name,
            description,
            goalPlanId,
            employeeId,
            type,
            weight,
            status,
        };

        if (editingGoal) {
            const docRef = doc(firestore, 'goals', editingGoal.id);
            updateDocumentNonBlocking(docRef, goalData);
            toast({ title: "Success", description: `Goal "${name}" updated.` });
        } else {
            const collRef = collection(firestore, 'goals');
            addDocumentNonBlocking(collRef, goalData);
            toast({ title: "Success", description: `Goal "${name}" created.` });
        }
        handleCloseDialog();
    };

    const handleDelete = (id: string) => {
        const docRef = doc(firestore, 'goals', id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: "Success", description: "Goal deleted." });
    };

    const getGoalPlanName = (id: string) => goalPlans?.find(gp => gp.id === id)?.name || 'N/A';
    const getEmployeeName = (id: string) => {
        const emp = employees?.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    };

    const tableColumns = useMemo(() => columns({ onEdit: handleOpenDialog, onDelete: handleDelete, getGoalPlanName, getEmployeeName }), [goalPlans, employees]);
    
    const employeeOptions = useMemo(() => {
        if (!employees) return [];
        return employees.map(emp => ({
            value: emp.id,
            label: `${emp.firstName} ${emp.lastName} (${emp.personNumber})`,
        }));
    }, [employees]);

    const goalPlanOptions = useMemo(() => {
        if (!goalPlans) return [];
        return goalPlans.map(gp => ({
            value: gp.id,
            label: gp.name,
        }));
    }, [goalPlans]);

    const filteredData = useMemo(() => {
        if (!goals) return [];
        return goals.filter(goal => {
            const goalPlanMatch = !filterGoalPlanId || goal.goalPlanId === filterGoalPlanId;
            const employeeMatch = !filterEmployeeId || goal.employeeId === filterEmployeeId;
            return goalPlanMatch && employeeMatch;
        })
    }, [goals, filterGoalPlanId, filterEmployeeId]);

    const handleFilterChange = (type: 'goalPlan' | 'employee', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(type === 'goalPlan' ? 'goalPlanId' : 'employeeId', value);
        } else {
            params.delete(type === 'goalPlan' ? 'goalPlanId' : 'employeeId');
        }
        router.push(`/configuration/goals?${params.toString()}`);
    };


    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Manage Goals"
                description="Manage goals against goal plans and employees."
                onAddNew={() => handleOpenDialog()}
            />
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <Combobox 
                    options={goalPlanOptions}
                    value={filterGoalPlanId}
                    onChange={(val) => handleFilterChange('goalPlan', val)}
                    placeholder="Filter by Goal Plan..."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
                <Combobox 
                    options={employeeOptions}
                    value={filterEmployeeId}
                    onChange={(val) => handleFilterChange('employee', val)}
                    placeholder="Filter by Employee..."
                    searchPlaceholder="Search employees..."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
            </div>

            <DataTable columns={tableColumns} data={filteredData} filterColumn="name" />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline">{editingGoal ? 'Edit' : 'Create New'} Goal</DialogTitle>
                        <DialogDescription>Fill in the details for the goal below.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="goal-name">Goal Name</Label>
                            <Input id="goal-name" placeholder="e.g., Improve API response time" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="goal-desc">Goal Description</Label>
                            <Textarea id="goal-desc" placeholder="Describe the goal in detail..." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Goal Plan</Label>
                                <Select onValueChange={setGoalPlanId} value={goalPlanId}>
                                    <SelectTrigger><SelectValue placeholder="Select Goal Plan"/></SelectTrigger>
                                    <SelectContent>{goalPlans?.map(gp => <SelectItem key={gp.id} value={gp.id}>{gp.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Employee</Label>
                                <Combobox options={employeeOptions} value={employeeId} onChange={setEmployeeId} placeholder="Select Employee" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label>Type</Label>
                                <Select onValueChange={(v: 'Work' | 'Home') => setType(v)} value={type}>
                                    <SelectTrigger><SelectValue placeholder="Select Type"/></SelectTrigger>
                                    <SelectContent><SelectItem value="Work">Work</SelectItem><SelectItem value="Home">Home</SelectItem></SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="goal-weight">Weight (%)</Label>
                                <Input id="goal-weight" type="number" placeholder="e.g., 20" value={weight ?? ''} onChange={e => setWeight(e.target.valueAsNumber || undefined)} />
                            </div>
                             <div className="space-y-2">
                                <Label>Status</Label>
                                 <Select onValueChange={(v: Goal['status']) => setStatus(v)} value={status}>
                                    <SelectTrigger><SelectValue placeholder="Select Status"/></SelectTrigger>
                                    <SelectContent>{GOAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSave}>{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function GoalsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GoalsContent />
        </Suspense>
    )
}
