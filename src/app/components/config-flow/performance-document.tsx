
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { StepProps, PerformanceDocument as PerfDocType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';

export function PerformanceDocument({ state, dispatch, onComplete }: StepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [performanceCycleId, setPerformanceCycleId] = useState<string>();
  const [performanceTemplateId, setPerformanceTemplateId] = useState<string>();
  const [evaluationFlowId, setEvaluationFlowId] = useState<string>();
  const [eligibilityId, setEligibilityId] = useState<string>();
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [managerRating, setManagerRating] = useState(true);
  const [employeeRating, setEmployeeRating] = useState(true);
  const [managerComments, setManagerComments] = useState(true);
  const [employeeComments, setEmployeeComments] = useState(true);
  const { toast } = useToast();
  
  const isCreateDisabled = !name || !performanceCycleId || !performanceTemplateId || !evaluationFlowId || !eligibilityId;

  const handleCreateDocument = () => {
    if (isCreateDisabled) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    const newDoc: PerfDocType = {
      id: `pd-${Date.now()}`,
      name,
      performanceCycleId: performanceCycleId!,
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
    
    // Reset form
    setName('');
    setPerformanceCycleId(undefined);
    setPerformanceTemplateId(undefined);
    setEvaluationFlowId(undefined);
    setEligibilityId(undefined);
    setSelectedSections([]);
    setIsDialogOpen(false);
    onComplete();
  };
  
  const getPerformanceTemplateName = (id: string) => state.performanceTemplates.find(dt => dt.id === id)?.name || '';
  const availableSections = state.performanceTemplateSections.filter(s => s.performanceTemplateId === performanceTemplateId);
  const getPerformanceCycleName = (id: string) => {
    const cycle = state.performanceCycles.find(c => c.id === id);
    if (!cycle) return 'N/A';
    const reviewPeriod = state.reviewPeriods.find(p => p.id === cycle.reviewPeriodId);
    return `${cycle.name} (${reviewPeriod?.name || 'N/A'})`;
  }

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
                    state.performanceDocuments.map(doc => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Select onValueChange={setPerformanceCycleId} value={performanceCycleId}><SelectTrigger><SelectValue placeholder="Select Performance Cycle"/></SelectTrigger><SelectContent>{state.performanceCycles.map(p => <SelectItem key={p.id} value={p.id}>{getPerformanceCycleName(p.id)}</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={setPerformanceTemplateId} value={performanceTemplateId}><SelectTrigger><SelectValue placeholder="Select Performance Template"/></SelectTrigger><SelectContent>{state.performanceTemplates.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={setEvaluationFlowId} value={evaluationFlowId}><SelectTrigger><SelectValue placeholder="Attach Evaluation Flow"/></SelectTrigger><SelectContent>{state.evaluationFlows.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={setEligibilityId} value={eligibilityId}><SelectTrigger><SelectValue placeholder="Attach Eligibility Criteria"/></SelectTrigger><SelectContent>{state.eligibility.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                </div>

                {performanceTemplateId && availableSections.length > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-semibold">Select Performance Template Sections for "{getPerformanceTemplateName(performanceTemplateId)}"</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableSections.map(section => (
                        <div key={section.id} className="flex items-center space-x-2">
                            <Checkbox
                            id={section.id}
                            checked={selectedSections.includes(section.id)}
                            onCheckedChange={(checked) => {
                                return checked
                                ? setSelectedSections([...selectedSections, section.id])
                                : setSelectedSections(selectedSections.filter((id) => id !== section.id));
                            }}
                            />
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateDocument} disabled={isCreateDisabled}>Create & Finalize Document</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
