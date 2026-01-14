
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { StepProps, PerformanceDocument as PerfDocType, PerformanceCycle, ReviewPeriod, GoalPlan, PerformanceTemplate, EvaluationFlow, Eligibility } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function PerformanceDocument({ state, dispatch, onComplete }: StepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [performanceCycleId, setPerformanceCycleId] = useState<string>();
  const [performanceTemplateId, setPerformanceTemplateId] = useState<string>();
  const [goalPlanId, setGoalPlanId] = useState<string>();
  const [evaluationFlowId, setEvaluationFlowId] = useState<string>();
  const [eligibilityId, setEligibilityId] = useState<string>();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const isCreateDisabled = !name || !performanceCycleId || !performanceTemplateId || !evaluationFlowId || !eligibilityId || !goalPlanId;

  const handleCreateDocument = () => {
    if (isCreateDisabled) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    const allSectionIdsForTemplate = state.performanceTemplateSections
        .filter(s => s.performanceTemplateId === performanceTemplateId)
        .map(s => s.id);

    const newDoc: Omit<PerfDocType, 'id'> = {
      name,
      performanceCycleId: performanceCycleId!,
      goalPlanId: goalPlanId!,
      performanceTemplateId: performanceTemplateId!,
      sectionIds: allSectionIdsForTemplate,
      evaluationFlowId: evaluationFlowId!,
      eligibilityId: eligibilityId!,
      isLaunched: false,
    };
    
    addDocumentNonBlocking(collection(firestore, 'performance_documents'), newDoc);
    toast({ title: "Success", description: `Performance document "${name}" has been created.` });
    
    // Reset form
    setName('');
    setPerformanceCycleId(undefined);
    setPerformanceTemplateId(undefined);
    setGoalPlanId(undefined);
    setEvaluationFlowId(undefined);
    setEligibilityId(undefined);
    setIsDialogOpen(false);
    onComplete();
  };

  const handlePerformanceCycleChange = (cycleId: string) => {
    setPerformanceCycleId(cycleId);
    setGoalPlanId(undefined); 
  }

  const availableGoalPlans = useMemo(() => {
    if (!performanceCycleId) return [];
    const selectedCycle = (state.performanceCycles as PerformanceCycle[]).find(c => c.id === performanceCycleId);
    if (!selectedCycle) return [];
    return (state.goalPlans as GoalPlan[]).filter(gp => gp.reviewPeriodId === selectedCycle.reviewPeriodId);
  }, [performanceCycleId, state.performanceCycles, state.goalPlans]);
  
  const getPerformanceTemplateName = (id: string) => state.performanceTemplates.find(dt => dt.id === id)?.name || '';
  const getPerformanceCycleName = (id: string) => {
    const cycle = (state.performanceCycles as PerformanceCycle[]).find(c => c.id === id);
    if (!cycle) return 'N/A';
    const reviewPeriod = (state.reviewPeriods as ReviewPeriod[]).find(p => p.id === cycle.reviewPeriodId);
    return `${cycle.name} (${reviewPeriod?.name || 'N/A'})`;
  }
  const getReviewPeriodName = (id: string) => (state.reviewPeriods as ReviewPeriod[]).find(p => p.id === id)?.name || '';


  return (
    <div className="space-y-6">
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Performance Documents</CardTitle>
                    <CardDescription>A list of all fully configured and created performance documents.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2" />
                        Create Document
                    </Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Performance Cycle</TableHead><TableHead>Performance Template</TableHead></TableRow></TableHeader>
                <TableBody>
                {state.performanceDocuments.length > 0 ? (
                    (state.performanceDocuments as PerfDocType[]).map(doc => (
                    <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{getPerformanceCycleName(doc.performanceCycleId)}</TableCell>
                        <TableCell>{state.performanceTemplates.find(p => p.id === doc.performanceTemplateId)?.name}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-8">No performance documents created yet.</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Assemble Performance Document</DialogTitle>
                <DialogDescription>This is the core orchestration step where all previously defined components are integrated.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <Input placeholder="Performance Document Name" value={name} onChange={e => setName(e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <Select onValueChange={handlePerformanceCycleChange} value={performanceCycleId}><SelectTrigger><SelectValue placeholder="Select Performance Cycle"/></SelectTrigger><SelectContent>{(state.performanceCycles as PerformanceCycle[]).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({getReviewPeriodName(p.reviewPeriodId)})</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={setGoalPlanId} value={goalPlanId} disabled={!performanceCycleId}><SelectTrigger><SelectValue placeholder="Select Goal Plan"/></SelectTrigger><SelectContent>{availableGoalPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={setPerformanceTemplateId} value={performanceTemplateId}><SelectTrigger><SelectValue placeholder="Select Performance Template"/></SelectTrigger><SelectContent>{(state.performanceTemplates as PerformanceTemplate[]).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={setEvaluationFlowId} value={evaluationFlowId}><SelectTrigger><SelectValue placeholder="Attach Evaluation Flow"/></SelectTrigger><SelectContent>{(state.evaluationFlows as EvaluationFlow[]).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={setEligibilityId} value={eligibilityId}><SelectTrigger><SelectValue placeholder="Attach Eligibility Criteria"/></SelectTrigger><SelectContent>{(state.eligibility as Eligibility[]).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                </div>
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateDocument} disabled={isCreateDisabled}>Create & Finalize Document</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
