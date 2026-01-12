
'use client';

import { useReducer, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceDocument as PerfDocType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';


export default function PerformanceDocumentsPage() {
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Editing is not implemented for Performance Documents as requested.
    // const [editingDoc, setEditingDoc] = useState<PerfDocType | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [reviewPeriodId, setReviewPeriodId] = useState<string>();
    const [goalPlanId, setGoalPlanId] = useState<string>();
    const [performanceTemplateId, setPerformanceTemplateId] = useState<string>();
    const [evaluationFlowId, setEvaluationFlowId] = useState<string>();
    const [eligibilityId, setEligibilityId] = useState<string>();
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [managerRating, setManagerRating] = useState(true);
    const [employeeRating, setEmployeeRating] = useState(true);
    const [managerComments, setManagerComments] = useState(true);
    const [employeeComments, setEmployeeComments] = useState(true);

    const resetForm = () => {
        setName('');
        setReviewPeriodId(undefined);
        setGoalPlanId(undefined);
        setPerformanceTemplateId(undefined);
        setEvaluationFlowId(undefined);
        setEligibilityId(undefined);
        setSelectedSections([]);
        setManagerRating(true);
        setEmployeeRating(true);
        setManagerComments(true);
        setEmployeeComments(true);
    }
    
    const handleOpenDialog = (doc: PerfDocType | null = null) => {
        // Editing not implemented
        resetForm();
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    const isCreateDisabled = !name || !reviewPeriodId || !goalPlanId || !performanceTemplateId || !evaluationFlowId || !eligibilityId;

    const handleCreateDocument = () => {
        if (isCreateDisabled) {
          toast({ title: "All fields are required", variant: "destructive" });
          return;
        }

        const newDoc: PerfDocType = {
          id: `pd-${Date.now()}`,
          name,
          reviewPeriodId: reviewPeriodId!,
          goalPlanId: goalPlanId!,
          performanceTemplateId: performanceTemplateId!,
          sectionIds: selectedSections,
          evaluationFlowId: evaluationFlowId!,
          eligibilityId: eligibilityId!,
          managerRatingEnabled: managerRating,
          employeeRatingEnabled: employeeRating,
          managerCommentsEnabled: managerComments,
          employeeCommentsEnabled: employeeComments,
        };

        dispatch({ type: 'ADD_PERFORMANCE_DOCUMENT', payload: newDoc });
        toast({ title: "Success", description: `Performance document "${name}" has been created.` });
        handleCloseDialog();
    };

    const getLookUpName = (type: 'reviewPeriod' | 'goalPlan' | 'performanceTemplate', id: string) => {
        switch(type) {
            case 'reviewPeriod': return state.reviewPeriods.find(p => p.id === id)?.name || '';
            case 'goalPlan': return state.goalPlans.find(p => p.id === id)?.name || '';
            case 'performanceTemplate': return state.performanceTemplates.find(p => p.id === id)?.name || '';
            default: return '';
        }
    }
    const availableSections = state.performanceTemplateSections.filter(s => s.performanceTemplateId === performanceTemplateId);


    const tableColumns = columns({ getLookUpName });

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Performance Documents"
                description="Manage all your performance documents here."
                onAddNew={handleOpenDialog}
            />
            <DataTable columns={tableColumns} data={state.performanceDocuments} />
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Assemble Performance Document</DialogTitle>
                        <DialogDescription>This is the core orchestration step where all previously defined components are integrated.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <Input placeholder="Performance Document Name" value={name} onChange={e => setName(e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Select onValueChange={setReviewPeriodId} value={reviewPeriodId}><SelectTrigger><SelectValue placeholder="Select Review Period"/></SelectTrigger><SelectContent>{state.reviewPeriods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setGoalPlanId} value={goalPlanId}><SelectTrigger><SelectValue placeholder="Select Goal Plan"/></SelectTrigger><SelectContent>{state.goalPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setPerformanceTemplateId} value={performanceTemplateId}><SelectTrigger><SelectValue placeholder="Select Performance Template"/></SelectTrigger><SelectContent>{state.performanceTemplates.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setEvaluationFlowId} value={evaluationFlowId}><SelectTrigger><SelectValue placeholder="Attach Evaluation Flow"/></SelectTrigger><SelectContent>{state.evaluationFlows.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setEligibilityId} value={eligibilityId}><SelectTrigger><SelectValue placeholder="Attach Eligibility Criteria"/></SelectTrigger><SelectContent>{state.eligibility.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                        </div>

                        {performanceTemplateId && availableSections.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-semibold">Select Performance Template Sections for "{getLookUpName('performanceTemplate', performanceTemplateId)}"</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {availableSections.map(section => (
                                <div key={section.id} className="flex items-center space-x-2">
                                    <Checkbox id={section.id} checked={selectedSections.includes(section.id)} onCheckedChange={(checked) => { return checked ? setSelectedSections([...selectedSections, section.id]) : setSelectedSections(selectedSections.filter((id) => id !== section.id)); }} />
                                    <Label htmlFor={section.id}>{section.name}</Label>
                                </div>
                                ))}
                            </div>
                            </div>
                        )}

                        <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-semibold">Additional Configuration</h4>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2"><Switch id="mgr-rating" checked={managerRating} onCheckedChange={setManagerRating} /><Label htmlFor="mgr-rating">Manager Rating</Label></div>
                                <div className="flex items-center space-x-2"><Switch id="emp-rating" checked={employeeRating} onCheckedChange={setEmployeeRating} /><Label htmlFor="emp-rating">Employee Rating</Label></div>
                                <div className="flex items-center space-x-2"><Switch id="mgr-comment" checked={managerComments} onCheckedChange={setManagerComments} /><Label htmlFor="mgr-comment">Manager Comments</Label></div>
                                <div className="flex items-center space-x-2"><Switch id="emp-comment" checked={employeeComments} onCheckedChange={setEmployeeComments} /><Label htmlFor="emp-comment">Employee Comments</Label></div>
                            </div>
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
