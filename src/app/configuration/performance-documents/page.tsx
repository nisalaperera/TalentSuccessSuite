
'use client';

import { useReducer, useState, useMemo } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceDocument as PerfDocType, ReviewPeriod, PerformanceCycle, GoalPlan, PerformanceTemplate, EvaluationFlow, Eligibility, PerformanceTemplateSection } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export default function PerformanceDocumentsPage() {
    const firestore = useFirestore();
    
    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
    
    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

    const performanceTemplatesQuery = useMemoFirebase(() => collection(firestore, 'performance_templates'), [firestore]);
    const { data: performanceTemplates } = useCollection<PerformanceTemplate>(performanceTemplatesQuery);

    const evaluationFlowsQuery = useMemoFirebase(() => collection(firestore, 'evaluation_flows'), [firestore]);
    const { data: evaluationFlows } = useCollection<EvaluationFlow>(evaluationFlowsQuery);

    const eligibilityQuery = useMemoFirebase(() => collection(firestore, 'eligibility_criteria'), [firestore]);
    const { data: eligibilityCriteria } = useCollection<Eligibility>(eligibilityQuery);

    const performanceTemplateSectionsQuery = useMemoFirebase(() => collection(firestore, 'performance_template_sections'), [firestore]);
    const { data: performanceTemplateSections } = useCollection<PerformanceTemplateSection>(performanceTemplateSectionsQuery);
    
    const performanceDocumentsQuery = useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]);
    const { data: performanceDocuments } = useCollection<PerfDocType>(performanceDocumentsQuery);


    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [performanceCycleId, setPerformanceCycleId] = useState<string>();
    const [performanceTemplateId, setPerformanceTemplateId] = useState<string>();
    const [evaluationFlowId, setEvaluationFlowId] = useState<string>();
    const [eligibilityId, setEligibilityId] = useState<string>();

    const resetForm = () => {
        setName('');
        setPerformanceCycleId(undefined);
        setPerformanceTemplateId(undefined);
        setEvaluationFlowId(undefined);
        setEligibilityId(undefined);
    }
    
    const handleOpenDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    const isCreateDisabled = !name || !performanceCycleId || !performanceTemplateId || !evaluationFlowId || !eligibilityId;

    const handleCreateDocument = () => {
        if (isCreateDisabled) {
          toast({ title: "All fields are required", variant: "destructive" });
          return;
        }

        const allSectionIdsForTemplate = (performanceTemplateSections || [])
            .filter(s => s.performanceTemplateId === performanceTemplateId)
            .map(s => s.id);

        const newDoc: Omit<PerfDocType, 'id'> = {
          name,
          performanceCycleId: performanceCycleId!,
          performanceTemplateId: performanceTemplateId!,
          sectionIds: allSectionIdsForTemplate,
          evaluationFlowId: evaluationFlowId!,
          eligibilityId: eligibilityId!,
        };
        
        const collRef = collection(firestore, 'performance_documents');
        addDocumentNonBlocking(collRef, newDoc);
        toast({ title: "Success", description: `Performance document "${name}" has been created.` });
        handleCloseDialog();
    };

    const getLookUpName = (type: 'reviewPeriod' | 'performanceCycle' | 'performanceTemplate', id: string) => {
        switch(type) {
            case 'reviewPeriod': return reviewPeriods?.find(p => p.id === id)?.name || '';
            case 'performanceCycle':
                const cycle = performanceCycles?.find(c => c.id === id);
                if (!cycle) return '';
                const reviewPeriod = reviewPeriods?.find(p => p.id === cycle.reviewPeriodId);
                return `${cycle.name} (${reviewPeriod?.name || 'N/A'})`;
            case 'performanceTemplate': return performanceTemplates?.find(p => p.id === id)?.name || '';
            default: return '';
        }
    }
    
    const tableColumns = useMemo(() => columns({ getLookUpName }), [reviewPeriods, performanceCycles, performanceTemplates]);

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Performance Documents"
                description="Manage all your performance documents here."
                onAddNew={handleOpenDialog}
            />
            <DataTable columns={tableColumns} data={performanceDocuments ?? []} />
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Assemble Performance Document</DialogTitle>
                        <DialogDescription>This is the core orchestration step where all previously defined components are integrated.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <Input placeholder="Performance Document Name" value={name} onChange={e => setName(e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            <Select onValueChange={setPerformanceCycleId} value={performanceCycleId}><SelectTrigger><SelectValue placeholder="Select Performance Cycle"/></SelectTrigger><SelectContent>{(performanceCycles || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({getLookUpName('reviewPeriod', p.reviewPeriodId)})</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setPerformanceTemplateId} value={performanceTemplateId}><SelectTrigger><SelectValue placeholder="Select Performance Template"/></SelectTrigger><SelectContent>{(performanceTemplates || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setEvaluationFlowId} value={evaluationFlowId}><SelectTrigger><SelectValue placeholder="Attach Evaluation Flow"/></SelectTrigger><SelectContent>{(evaluationFlows || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setEligibilityId} value={eligibilityId}><SelectTrigger><SelectValue placeholder="Attach Eligibility Criteria"/></SelectTrigger><SelectContent>{(eligibilityCriteria || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleCreateDocument} disabled={isCreateDisabled}>Create & Finalize Document</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
