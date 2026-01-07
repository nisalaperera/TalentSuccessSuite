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

export function PerformanceDocument({ state, dispatch }: StepProps) {
  const [name, setName] = useState('');
  const [reviewPeriodId, setReviewPeriodId] = useState<string>();
  const [goalPlanId, setGoalPlanId] = useState<string>();
  const [documentTypeId, setDocumentTypeId] = useState<string>();
  const [evaluationFlowId, setEvaluationFlowId] = useState<string>();
  const [eligibilityId, setEligibilityId] = useState<string>();
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [managerRating, setManagerRating] = useState(true);
  const [employeeRating, setEmployeeRating] = useState(true);
  const [managerComments, setManagerComments] = useState(true);
  const [employeeComments, setEmployeeComments] = useState(true);
  const { toast } = useToast();

  const handleCreateDocument = () => {
    if (!name || !reviewPeriodId || !goalPlanId || !documentTypeId || !evaluationFlowId || !eligibilityId) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    const newDoc: PerfDocType = {
      id: `pd-${Date.now()}`,
      name,
      reviewPeriodId,
      goalPlanId,
      documentTypeId,
      sectionIds: selectedSections,
      evaluationFlowId,
      eligibilityId,
      managerRatingEnabled: managerRating,
      employeeRatingEnabled: employeeRating,
      managerCommentsEnabled: managerComments,
      employeeCommentsEnabled: employeeComments,
    };

    dispatch({ type: 'ADD_PERFORMANCE_DOCUMENT', payload: newDoc });
    toast({ title: "Success", description: `Performance document "${name}" has been created.` });
    
    // Reset form
    setName('');
    setReviewPeriodId(undefined);
    setGoalPlanId(undefined);
    setDocumentTypeId(undefined);
    setEvaluationFlowId(undefined);
    setEligibilityId(undefined);
    setSelectedSections([]);
  };
  
  const getDocTypeName = (id: string) => state.documentTypes.find(dt => dt.id === id)?.name || '';
  const availableSections = state.documentSections.filter(s => s.documentTypeId === documentTypeId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Assemble Performance Document</CardTitle>
          <CardDescription>This is the core orchestration step where all previously defined components are integrated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Performance Document Name" value={name} onChange={e => setName(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select onValueChange={setReviewPeriodId} value={reviewPeriodId}><SelectTrigger><SelectValue placeholder="Select Review Period"/></SelectTrigger><SelectContent>{state.reviewPeriods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setGoalPlanId} value={goalPlanId}><SelectTrigger><SelectValue placeholder="Select Goal Plan"/></SelectTrigger><SelectContent>{state.goalPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setDocumentTypeId} value={documentTypeId}><SelectTrigger><SelectValue placeholder="Select Document Type"/></SelectTrigger><SelectContent>{state.documentTypes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setEvaluationFlowId} value={evaluationFlowId}><SelectTrigger><SelectValue placeholder="Attach Evaluation Flow"/></SelectTrigger><SelectContent>{state.evaluationFlows.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setEligibilityId} value={eligibilityId}><SelectTrigger><SelectValue placeholder="Attach Eligibility Criteria"/></SelectTrigger><SelectContent>{state.eligibility.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
          </div>

          {documentTypeId && availableSections.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold">Select Document Sections for "{getDocTypeName(documentTypeId)}"</h4>
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

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreateDocument}>Create & Finalize Document</Button>
          </div>

        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="font-headline">Created Performance Documents</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Review Period</TableHead><TableHead>Document Type</TableHead></TableRow></TableHeader>
            <TableBody>
              {state.performanceDocuments.length > 0 ? (
                state.performanceDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{state.reviewPeriods.find(p => p.id === doc.reviewPeriodId)?.name}</TableCell>
                    <TableCell>{state.documentTypes.find(p => p.id === doc.documentTypeId)?.name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center">No performance documents created yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
