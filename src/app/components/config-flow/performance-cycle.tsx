
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import type { StepProps, PerformanceCycle as PerformanceCycleType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DatePicker } from './shared/date-picker';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface PerformanceCycleProps extends StepProps {
    selectedReviewPeriodId?: string;
    selectedPerformanceCycleId?: string;
    setSelectedPerformanceCycleId: (id: string) => void;
}

export function PerformanceCycle({ state, dispatch, onComplete, selectedReviewPeriodId, selectedPerformanceCycleId, setSelectedPerformanceCycleId }: PerformanceCycleProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<PerformanceCycleType | null>(null);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    if (editingCycle) {
      setName(editingCycle.name);
      setStartDate(editingCycle.startDate);
      setEndDate(editingCycle.endDate);
      setIsDialogOpen(true);
    } else {
      setName('');
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [editingCycle]);
  
  const handleOpenDialog = (cycle: PerformanceCycleType | null = null) => {
    setEditingCycle(cycle);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingCycle(null);
    setIsDialogOpen(false);
  };


  const handleSave = () => {
    if (!name || !startDate || !endDate || !selectedReviewPeriodId) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name, dates, and ensure a review period is selected.',
        variant: 'destructive',
      });
      return;
    }
    
    const parentReviewPeriod = state.reviewPeriods.find(p => p.id === selectedReviewPeriodId);
    if (!parentReviewPeriod) {
        toast({ title: 'Invalid Review Period', description: 'The selected review period could not be found.', variant: 'destructive' });
        return;
    }

    if (startDate < parentReviewPeriod.startDate || endDate > parentReviewPeriod.endDate) {
        toast({ title: 'Invalid Dates', description: 'Cycle dates must be within the parent review period.', variant: 'destructive' });
        return;
    }
    
    if (endDate < startDate) {
        toast({ title: 'Invalid Dates', description: 'End date cannot be before start date.', variant: 'destructive' });
        return;
    }

    const overlappingCycle = state.performanceCycles.find(cycle => {
        if (cycle.reviewPeriodId !== selectedReviewPeriodId) return false;
        if (editingCycle && cycle.id === editingCycle.id) return false;
        return startDate <= cycle.endDate && endDate >= cycle.startDate;
    });

    if (overlappingCycle) {
        toast({ title: 'Overlapping Dates', description: `Dates overlap with existing cycle: "${overlappingCycle.name}".`, variant: 'destructive' });
        return;
    }

    if (editingCycle) {
      const updatedCycle = { ...editingCycle, name, startDate, endDate };
      dispatch({ type: 'UPDATE_PERFORMANCE_CYCLE', payload: updatedCycle });
      toast({ title: 'Success', description: `Performance cycle "${name}" updated.` });
    } else {
      const newCycle: PerformanceCycleType = {
        id: `pc-${Date.now()}`,
        name,
        reviewPeriodId: selectedReviewPeriodId,
        startDate,
        endDate,
        status: 'Active',
      };
      dispatch({ type: 'ADD_PERFORMANCE_CYCLE', payload: newCycle });
      setSelectedPerformanceCycleId(newCycle.id);
      toast({ title: 'Success', description: `Performance cycle "${name}" has been created.` });
      onComplete();
    }
    
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_PERFORMANCE_CYCLE', payload: id });
    toast({ title: 'Success', description: 'Performance cycle deleted.'});
  };

  const handleToggleStatus = (cycle: PerformanceCycleType) => {
    const newStatus = cycle.status === 'Active' ? 'Inactive' : 'Active';
    dispatch({ type: 'UPDATE_PERFORMANCE_CYCLE', payload: { ...cycle, status: newStatus } });
    toast({ title: 'Success', description: `Cycle status set to ${newStatus}.` });
  };


  const getReviewPeriodName = (id: string) => {
    return state.reviewPeriods.find(p => p.id === id)?.name || 'N/A';
  }
  
  const handleSelection = (id: string) => {
    setSelectedPerformanceCycleId(id);
    onComplete();
  };
  
  const filteredCycles = state.performanceCycles.filter(gp => gp.reviewPeriodId === selectedReviewPeriodId);

  return (
    <div className="space-y-6">
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Performance Cycles for "{getReviewPeriodName(selectedReviewPeriodId || '')}"</CardTitle>
                    <CardDescription>Define and select specific evaluation cycles within this review period.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2" />Add New Cycle</Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
                <RadioGroup value={selectedPerformanceCycleId} onValueChange={handleSelection}>
                    <TooltipProvider>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Cycle Name</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCycles.length > 0 ? (
                            filteredCycles.map((cycle) => (
                                <TableRow key={cycle.id} data-state={cycle.id === selectedPerformanceCycleId ? 'selected' : 'unselected'}>
                                <TableCell><RadioGroupItem value={cycle.id} id={`cycle-${cycle.id}`} /></TableCell>
                                <TableCell className="font-medium"><Label htmlFor={`cycle-${cycle.id}`} className="cursor-pointer">{cycle.name}</Label></TableCell>
                                <TableCell>{format(cycle.startDate, 'PPP')}</TableCell>
                                <TableCell>{format(cycle.endDate, 'PPP')}</TableCell>
                                <TableCell>{cycle.status}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cycle)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger>
                                            <TooltipContent><p>Edit Cycle</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the performance cycle.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(cycle.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Delete Cycle</p></TooltipContent>
                                        </Tooltip>
                                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(cycle)}>
                                            {cycle.status === 'Active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            <span className="sr-only">{cycle.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                        </Button>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">No performance cycles created for this review period yet.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </TooltipProvider>
                </RadioGroup>
            </CardContent>
        </Card>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="font-headline">{editingCycle ? 'Edit' : 'Create New'} Performance Cycle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Input
                    placeholder="e.g., Q1 2025 Check-in"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
                <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleSave}>
                    <PlusCircle className="mr-2" />
                    {editingCycle ? 'Save Changes' : 'Create & Select'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
