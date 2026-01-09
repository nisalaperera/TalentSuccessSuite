
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Pencil, Power, PowerOff } from 'lucide-react';
import type { StepProps, EvaluationFlow as EvaluationFlowType, EvaluationStep } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from './shared/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const PROCESS_PHASES: EvaluationStep['task'][] = ['Worker Self-Evaluation', 'Manager Evaluation', 'Normalization', 'Share Document', 'Confirm Review Meeting', 'Provide Final Feedback', 'Close Document'];
const ROLES: EvaluationStep['role'][] = ['Primary (Worker)', 'Secondary (Manager)', 'Sec. Appraiser 1', 'Sec. Appraiser 2', 'HR / Dept Head'];
const SEQUENCE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface EvaluationFlowProps extends StepProps {
    selectedEvaluationFlowId?: string;
    setSelectedEvaluationFlowId: (id: string) => void;
}

export function EvaluationFlow({ state, dispatch, onComplete, selectedEvaluationFlowId, setSelectedEvaluationFlowId }: EvaluationFlowProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [steps, setSteps] = useState<Partial<EvaluationStep>[]>([]);
  const [editingFlow, setEditingFlow] = useState<EvaluationFlowType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingFlow) {
        setFlowName(editingFlow.name);
        setSteps(editingFlow.steps);
        setIsDialogOpen(true);
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

  const handleAddStep = () => {
    setSteps([...steps, { id: `step-${Date.now()}` }]);
  };

  const handleRemoveStep = (id?: string) => {
    if (!id) return;
    setSteps(steps.filter(step => step.id !== id));
  };
  
  const handleStepChange = (id: string, key: keyof EvaluationStep, value: any) => {
    setSteps(steps.map(step => (step.id === id ? { ...step, [key]: value } : step)));
  };

  const getFlowType = (sequence: number, index: number): EvaluationStep['flowType'] => {
      if (index === 0) return 'Start';
      const prevStep = steps
        .filter(s => s.sequence)
        .sort((a,b) => a.sequence! - b.sequence!)
        [index-1];
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

    const finalSteps: EvaluationStep[] = steps
      .map((s, index) => ({
        ...s,
        sequence: s.sequence!,
        task: s.task!,
        role: s.role!,
        flowType: getFlowType(s.sequence!, index),
      } as EvaluationStep))
      .sort((a, b) => a.sequence - b.sequence);

    if (editingFlow) {
        const updatedFlow = { ...editingFlow, name: flowName, steps: finalSteps };
        dispatch({ type: 'UPDATE_EVALUATION_FLOW', payload: updatedFlow });
        toast({ title: "Success", description: `Flow "${flowName}" updated.` });
    } else {
        const newFlow: EvaluationFlowType = { id: `flow-${Date.now()}`, name: flowName, steps: finalSteps, status: 'Active' };
        dispatch({ type: 'ADD_EVALUATION_FLOW', payload: newFlow });
        setSelectedEvaluationFlowId(newFlow.id);
        toast({ title: "Success", description: `Evaluation flow "${flowName}" has been saved.` });
        onComplete();
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_EVALUATION_FLOW', payload: id });
    toast({ title: 'Success', description: 'Evaluation flow deleted.'});
    if (id === selectedEvaluationFlowId) {
        setSelectedEvaluationFlowId('');
    }
  };

  const handleToggleStatus = (flow: EvaluationFlowType) => {
    const newStatus = flow.status === 'Active' ? 'Inactive' : 'Active';
    dispatch({ type: 'UPDATE_EVALUATION_FLOW', payload: { ...flow, status: newStatus } });
    toast({ title: 'Success', description: `Flow status set to ${newStatus}.` });
  };

  const handleSelection = (id: string) => {
    setSelectedEvaluationFlowId(id);
    onComplete();
  }

  const isFlowInUse = (id: string) => {
    return state.performanceDocuments.some(pd => pd.evaluationFlowId === id);
  }

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Evaluation Flows</CardTitle>
                    <CardDescription>Define who does what, when, and in what order for a document.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2" />
                        Add New
                    </Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
                <RadioGroup value={selectedEvaluationFlowId} onValueChange={handleSelection}>
                    <TooltipProvider>
                     {state.evaluationFlows.length > 0 ? (
                        state.evaluationFlows.map(flow => {
                            const inUse = isFlowInUse(flow.id);
                            return (
                            <div key={flow.id} className="p-4 border rounded-lg mb-4 flex items-center justify-between gap-4 data-[state=checked]:bg-muted" data-state={flow.id === selectedEvaluationFlowId ? 'checked' : 'unchecked'}>
                                <div className="flex items-start gap-4">
                                    <RadioGroupItem value={flow.id} id={`flow-${flow.id}`} className="mt-1" />
                                    <div>
                                        <Label htmlFor={`flow-${flow.id}`} className="font-bold font-headline mb-2 cursor-pointer">{flow.name} ({flow.status})</Label>
                                        <p className="text-sm text-muted-foreground">
                                        {flow.steps.map(s => s.task).join(' → ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Tooltip>
                                        <TooltipTrigger asChild><span tabIndex={0}><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(flow)} disabled={inUse}><Pencil className="h-4 w-4" /></Button></span></TooltipTrigger>
                                        {inUse && <TooltipContent><p>Cannot edit a flow that is in use.</p></TooltipContent>}
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span tabIndex={0}>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" disabled={inUse}><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the flow.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(flow.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </span>
                                        </TooltipTrigger>
                                        {inUse && <TooltipContent><p>Cannot delete a flow that is in use.</p></TooltipContent>}
                                    </Tooltip>
                                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(flow)}>
                                        {flow.status === 'Active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                        <span className="sr-only">{flow.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                    </Button>
                                </div>
                            </div>
                        )})
                    ) : (
                         <p className="text-center text-muted-foreground py-8">No evaluation flows created yet.</p>
                    )}
                    </TooltipProvider>
                </RadioGroup>
            </CardContent>
        </Card>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingFlow ? 'Edit' : 'Create New'} Evaluation Flow</DialogTitle>
                <DialogDescription>Define the sequence of tasks, roles, and deadlines for the evaluation process.</DialogDescription>
            </DialogHeader>
             <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <Input placeholder="Evaluation Flow Name" value={flowName} onChange={e => setFlowName(e.target.value)} className="md:w-1/2" />
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Seq.</TableHead>
                            <TableHead>Process Phase (Task)</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Flow Type</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {steps.map((step, index) => (
                            <TableRow key={step.id}>
                            <TableCell>
                                <Select onValueChange={(val) => handleStepChange(step.id!, 'sequence', parseInt(val))} value={step.sequence ? String(step.sequence) : ''}>
                                    <SelectTrigger className="w-20"><SelectValue placeholder="No." /></SelectTrigger>
                                    <SelectContent>{SEQUENCE_NUMBERS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select onValueChange={(val) => handleStepChange(step.id!, 'task', val)} value={step.task}>
                                    <SelectTrigger><SelectValue placeholder="Select Task" /></SelectTrigger>
                                    <SelectContent>{PROCESS_PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select onValueChange={(val) => handleStepChange(step.id!, 'role', val)} value={step.role}>
                                    <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                    <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell><DatePicker date={step.startDate} setDate={d => handleStepChange(step.id!, 'startDate', d)} placeholder="Start Date"/></TableCell>
                            <TableCell><DatePicker date={step.endDate} setDate={d => handleStepChange(step.id!, 'endDate', d)} placeholder="End Date"/></TableCell>
                            <TableCell>{step.sequence && getFlowType(step.sequence, index)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveStep(step.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
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
