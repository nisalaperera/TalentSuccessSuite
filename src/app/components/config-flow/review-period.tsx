

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from './shared/date-picker';
import { PlusCircle, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { format } from 'date-fns';
import type { StepProps, ReviewPeriod as ReviewPeriodType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useFirestore } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


interface ReviewPeriodProps extends StepProps {
    selectedReviewPeriodId?: string;
    setSelectedReviewPeriodId: (id: string) => void;
}

export function ReviewPeriod({ state, dispatch, onComplete, selectedReviewPeriodId, setSelectedReviewPeriodId }: ReviewPeriodProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReviewPeriodType | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (editingPeriod) {
      setName(editingPeriod.name);
      setStartDate(editingPeriod.startDate);
      setEndDate(editingPeriod.endDate);
      setIsDialogOpen(true);
    } else {
      setName('');
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [editingPeriod]);

  const handleOpenDialog = (period: ReviewPeriodType | null = null) => {
    setEditingPeriod(period);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingPeriod(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!name || !startDate || !endDate) {
      toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive' });
      return;
    }
    if (endDate < startDate) {
      toast({ title: 'Invalid Dates', description: 'End date cannot be before start date.', variant: 'destructive' });
      return;
    }

    const periodData = { 
        name, 
        startDate: Timestamp.fromDate(startDate), 
        endDate: Timestamp.fromDate(endDate),
        status: editingPeriod?.status || 'Active'
    };

    if (editingPeriod) {
      const docRef = doc(firestore, 'review_periods', editingPeriod.id);
      updateDocumentNonBlocking(docRef, periodData);
      toast({ title: 'Success', description: `Review period "${name}" has been updated.` });
    } else {
      const collRef = collection(firestore, 'review_periods');
      const promise = addDocumentNonBlocking(collRef, periodData);
      promise.then(docRef => {
        if(docRef?.id) {
          setSelectedReviewPeriodId(docRef.id);
        }
      });
      toast({ title: 'Success', description: `Review period "${name}" has been created.` });
      onComplete();
    }
    
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, 'review_periods', id));
    toast({ title: 'Success', description: 'Review period has been deleted.' });
    if (id === selectedReviewPeriodId) {
      setSelectedReviewPeriodId('');
    }
  };
  
  const handleToggleStatus = (period: ReviewPeriodType) => {
    const newStatus = period.status === 'Active' ? 'Inactive' : 'Active';
    updateDocumentNonBlocking(doc(firestore, 'review_periods', period.id), { status: newStatus });
    toast({ title: 'Success', description: `Period status set to ${newStatus}.` });
  };

  const handleSelection = (id: string) => {
    setSelectedReviewPeriodId(id);
    onComplete();
  };

  const isPeriodInUse = (id: string) => {
    return state.goalPlans.some(gp => gp.reviewPeriodId === id) || state.performanceCycles.some(pc => pc.reviewPeriodId === id);
  };

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
                <CardTitle className="font-headline">Review Periods</CardTitle>
                <CardDescription>Define the time boundary for all performance-related activities.</CardDescription>
            </div>
            <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2" />Add New</Button>
            </DialogTrigger>
            </CardHeader>
            <CardContent>
            <RadioGroup value={selectedReviewPeriodId} onValueChange={handleSelection}>
                <TooltipProvider>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Review Period Name</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {state.reviewPeriods.length > 0 ? (
                        (state.reviewPeriods as ReviewPeriodType[]).map((period) => {
                        const inUse = isPeriodInUse(period.id);
                        return (
                            <TableRow key={period.id} data-state={period.id === selectedReviewPeriodId ? 'selected' : 'unselected'}>
                            <TableCell><RadioGroupItem value={period.id} id={period.id} /></TableCell>
                            <TableCell className="font-medium"><Label htmlFor={period.id} className="cursor-pointer">{period.name}</Label></TableCell>
                            <TableCell>{format(period.startDate, 'PPP')}</TableCell>
                            <TableCell>{format(period.endDate, 'PPP')}</TableCell>
                            <TableCell>{period.status}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(period)} disabled={inUse}>
                                        <Pencil className="h-4 w-4" />
                                        </Button>
                                    </span>
                                    </TooltipTrigger>
                                    {inUse && <TooltipContent><p>Cannot edit a period that is in use.</p></TooltipContent>}
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0}>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={inUse}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the review period.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(period.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </span>
                                    </TooltipTrigger>
                                    {inUse && <TooltipContent><p>Cannot delete a period that is in use.</p></TooltipContent>}
                                </Tooltip>
                                
                                <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(period)}>
                                    {period.status === 'Active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                    <span className="sr-only">{period.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                </Button>

                                </div>
                            </TableCell>
                            </TableRow>
                        );
                        })
                    ) : (
                        <TableRow><TableCell colSpan={6} className="text-center">No review periods created yet.</TableCell></TableRow>
                    )}
                    </TableBody>
                </Table>
                </TooltipProvider>
            </RadioGroup>
            </CardContent>
        </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">{editingPeriod ? 'Edit' : 'Create New'} Review Period</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <Input placeholder="e.g., FY 2024-25 Mid-Year" value={name} onChange={(e) => setName(e.target.value)} />
              <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
              <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingPeriod ? 'Save Changes' : 'Create & Select'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
