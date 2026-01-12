
'use client';

import { useReducer, useState, useEffect } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { EvaluationFlow as EvaluationFlowType, EvaluationStep } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/app/components/config-flow/shared/date-picker';
import { PlusCircle, Trash2 } from 'lucide-react';

const PROCESS_PHASES: EvaluationStep['task'][] = ['Worker Self-Evaluation', 'Manager Evaluation', 'Normalization', 'Share Document', 'Confirm Review Meeting', 'Provide Final Feedback', 'Close Document'];
const ROLES: EvaluationStep['role'][] = ['Primary (Worker)', 'Secondary (Manager)', 'Sec. Appraiser 1', 'Sec. Appraiser 2', 'HR / Dept Head'];
const SEQUENCE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function EvaluationFlowsPage() {
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<EvaluationFlowType | null>(null);
    const { toast } = useToast();

    // Form state
    const [flowName, setFlowName] = useState('');
    const [steps, setSteps] = useState<Partial<EvaluationStep>[]>([]);

    useEffect(() => {
        if (editingFlow) {
            setFlowName(editingFlow.name);
            setSteps(editingFlow.steps);
        } else {
            setFlowName('');
            setSteps([]);
        }
    }, [editingFlow]);

    const handleOpenDialog = (flow: EvaluationFlowType | null = null) => {
        setEditingFlow(flow);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingFlow(null);
        setIsDialogOpen(false);
    };

    const handleAddStep = () => setSteps([...steps, { id: `step-${Date.now()}` }]);
    const handleRemoveStep = (id?: string) => { if (id) setSteps(steps.filter(step => step.id !== id)); };
    const handleStepChange = (id: string, key: keyof EvaluationStep, value: any) => {
        setSteps(steps.map(step => (step.id === id ? { ...step, [key]: value } : step)));
    };

    const getFlowType = (sequence: number, index: number): EvaluationStep['flowType'] => {
        if (index === 0) return 'Start';
        const prevStep = steps.filter(s => s.sequence).sort((a,b) => a.sequence! - b.sequence!)[index-1];
        if (prevStep && sequence === prevStep.sequence) return 'Parallel';
        return 'Sequential';
    }

    const handleSave = () => {
        if (!flowName) {
            toast({ title: "Flow name is required", variant: "destructive" });
            return;
        }
        if (steps.some(s => !s.sequence || !s.task || !s.role)) {
            toast({ title: "All fields in each step are required", variant: "destructive" });
            return;
        }

        const finalSteps: EvaluationStep[] = steps.map((s, index) => ({ ...s, sequence: s.sequence!, task: s.task!, role: s.role!, flowType: getFlowType(s.sequence!, index) } as EvaluationStep)).sort((a, b) => a.sequence - b.sequence);

        if (editingFlow) {
            const updatedFlow = { ...editingFlow, name: flowName, steps: finalSteps };
            dispatch({ type: 'UPDATE_EVALUATION_FLOW', payload: updatedFlow });
            toast({ title: "Success", description: `Flow "${flowName}" updated.` });
        } else {
            const newFlow: EvaluationFlowType = { id: `flow-${Date.now()}`, name: flowName, steps: finalSteps, status: 'Active' };
            dispatch({ type: 'ADD_EVALUATION_FLOW', payload: newFlow });
            toast({ title: "Success", description: `Flow "${flowName}" created.` });
        }
        handleCloseDialog();
    };

    const isFlowInUse = (id: string) => state.performanceDocuments.some(pd => pd.evaluationFlowId === id);

    const handleDelete = (id: string) => {
        dispatch({ type: 'DELETE_EVALUATION_FLOW', payload: id });
        toast({ title: 'Success', description: 'Evaluation flow deleted.' });
    };

    const handleToggleStatus = (flow: EvaluationFlowType) => {
        const newStatus = flow.status === 'Active' ? 'Inactive' : 'Active';
        dispatch({ type: 'UPDATE_EVALUATION_FLOW', payload: { ...flow, status: newStatus } });
        toast({ title: 'Success', description: `Flow status set to ${newStatus}.` });
    };

    const tableColumns = columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, isFlowInUse });

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Evaluation Flows"
                description="Manage all your evaluation flows here."
                onAddNew={() => handleOpenDialog()}
            />
            <DataTable columns={tableColumns} data={state.evaluationFlows} />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{editingFlow ? 'Edit' : 'Create New'} Evaluation Flow</DialogTitle>
                        <DialogDescription>Define the sequence of tasks, roles, and deadlines for the evaluation process.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <Input placeholder="Evaluation Flow Name" value={flowName} onChange={e => setFlowName(e.target.value)} className="md:w-1/2" />
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Seq.</TableHead><TableHead>Process Phase (Task)</TableHead><TableHead>Role</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead>Flow Type</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {steps.map((step, index) => (
                                    <TableRow key={step.id}>
                                    <TableCell><Select onValueChange={(val) => handleStepChange(step.id!, 'sequence', parseInt(val))} value={step.sequence ? String(step.sequence) : ''}><SelectTrigger className="w-20"><SelectValue placeholder="No." /></SelectTrigger><SelectContent>{SEQUENCE_NUMBERS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></TableCell>
                                    <TableCell><Select onValueChange={(val) => handleStepChange(step.id!, 'task', val)} value={step.task}><SelectTrigger><SelectValue placeholder="Select Task" /></SelectTrigger><SelectContent>{PROCESS_PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></TableCell>
                                    <TableCell><Select onValueChange={(val) => handleStepChange(step.id!, 'role', val)} value={step.role}><SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></TableCell>
                                    <TableCell><DatePicker date={step.startDate} setDate={d => handleStepChange(step.id!, 'startDate', d)} placeholder="Start Date"/></TableCell>
                                    <TableCell><DatePicker date={step.endDate} setDate={d => handleStepChange(step.id!, 'endDate', d)} placeholder="End Date"/></TableCell>
                                    <TableCell>{step.sequence && getFlowType(step.sequence, index)}</TableCell>
                                    <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveStep(step.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button variant="outline" onClick={handleAddStep}><PlusCircle className="mr-2" /> Add Step</Button>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSave}>{editingFlow ? 'Save Changes' : 'Save Flow'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
