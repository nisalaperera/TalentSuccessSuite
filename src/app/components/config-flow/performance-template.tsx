

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import type { StepProps, PerformanceTemplate as PerformanceTemplateType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface PerformanceTemplateProps extends StepProps {
    selectedPerformanceTemplateId?: string;
    setSelectedPerformanceTemplateId: (id: string) => void;
}

export function PerformanceTemplate({ state, dispatch, onComplete, selectedPerformanceTemplateId, setSelectedPerformanceTemplateId }: PerformanceTemplateProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Performance' | 'Survey' | undefined>();
  const [supportsRatings, setSupportsRatings] = useState(true);
  const [supportsComments, setSupportsComments] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PerformanceTemplateType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingTemplate) {
        setName(editingTemplate.name);
        setCategory(editingTemplate.category);
        setSupportsRatings(editingTemplate.supportsRatings);
        setSupportsComments(editingTemplate.supportsComments);
        setIsDialogOpen(true);
    } else {
        setName('');
        setCategory(undefined);
        setSupportsRatings(true);
        setSupportsComments(true);
    }
  }, [editingTemplate]);

  const handleOpenDialog = (template: PerformanceTemplateType | null = null) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!name || !category) {
       toast({
        title: 'Missing Information',
        description: 'Please provide a name and select a category.',
        variant: 'destructive',
      });
      return;
    }

    if (editingTemplate) {
        const updatedTemplate = { ...editingTemplate, name, category, supportsRatings, supportsComments };
        dispatch({ type: 'UPDATE_PERFORMANCE_TEMPLATE', payload: updatedTemplate });
        toast({ title: 'Success', description: `Template "${name}" updated.` });
    } else {
        const newTemplate: PerformanceTemplateType = {
            id: `pt-${Date.now()}`,
            name,
            category,
            supportsRatings,
            supportsComments,
            status: 'Active',
        };
        dispatch({ type: 'ADD_PERFORMANCE_TEMPLATE', payload: newTemplate });
        setSelectedPerformanceTemplateId(newTemplate.id);
        toast({ title: 'Success', description: `Performance template "${name}" has been created.` });
        onComplete();
    }
    
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_PERFORMANCE_TEMPLATE', payload: id });
    toast({ title: 'Success', description: 'Performance template deleted.'});
    if (id === selectedPerformanceTemplateId) {
      setSelectedPerformanceTemplateId('');
    }
  };

  const handleToggleStatus = (template: PerformanceTemplateType) => {
    const newStatus = template.status === 'Active' ? 'Inactive' : 'Active';
    dispatch({ type: 'UPDATE_PERFORMANCE_TEMPLATE', payload: { ...template, status: newStatus } });
    toast({ title: 'Success', description: `Template status set to ${newStatus}.` });
  };
  
  const handleSelection = (id: string) => {
    setSelectedPerformanceTemplateId(id);
    handleNext(); // to auto-open next step
  };

  const handleNext = () => {
    // This was causing premature closing, now it just opens the next section
     if (selectedPerformanceTemplateId) {
        onComplete();
     }
  }

  const isTemplateInUse = (id: string) => {
    return state.performanceDocuments.some(pd => pd.performanceTemplateId === id);
  }

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Performance Templates</CardTitle>
                    <CardDescription>Define what kind of document is being created and how it behaves.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2" />Add New</Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
            <RadioGroup value={selectedPerformanceTemplateId} onValueChange={handleSelection}>
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Performance Template Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Ratings</TableHead>
                            <TableHead>Comments</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {state.performanceTemplates.length > 0 ? (
                            state.performanceTemplates.map((template) => {
                                const inUse = isTemplateInUse(template.id);
                                return (
                                <TableRow key={template.id} data-state={template.id === selectedPerformanceTemplateId ? 'selected' : 'unselected'}>
                                    <TableCell>
                                        <RadioGroupItem value={template.id} id={template.id} />
                                    </TableCell>
                                    <TableCell className="font-medium"><Label htmlFor={template.id} className="cursor-pointer">{template.name}</Label></TableCell>
                                    <TableCell>{template.category}</TableCell>
                                    <TableCell>{template.supportsRatings ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{template.supportsComments ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{template.status}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild><span tabIndex={0}><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)} disabled={inUse}><Pencil className="h-4 w-4" /></Button></span></TooltipTrigger>
                                                {inUse && <TooltipContent><p>Cannot edit a template that is in use.</p></TooltipContent>}
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span tabIndex={0}>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" disabled={inUse}><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the template.</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(template.id)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </span>
                                                </TooltipTrigger>
                                                {inUse && <TooltipContent><p>Cannot delete a template that is in use.</p></TooltipContent>}
                                            </Tooltip>
                                            <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(template)}>
                                                {template.status === 'Active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                <span className="sr-only">{template.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                            <TableCell colSpan={7} className="text-center">No performance templates created yet.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </RadioGroup>
            </CardContent>
        </Card>
        <DialogContent onPointerDownOutside={(e) => { if (editingTemplate) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (editingTemplate) e.preventDefault(); }}>
             <DialogHeader>
                <DialogTitle className="font-headline">{editingTemplate ? 'Edit' : 'Create New'} Performance Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Input
                    placeholder="e.g., Annual Performance Document"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    />
                    <Select onValueChange={(value: 'Performance' | 'Survey') => setCategory(value)} value={category}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a Document Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Performance">Performance Document</SelectItem>
                        <SelectItem value="Survey">Survey Document</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2">
                        <Switch id="ratings-switch" checked={supportsRatings} onCheckedChange={setSupportsRatings} />
                        <Label htmlFor="ratings-switch">Supports Ratings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="comments-switch" checked={supportsComments} onCheckedChange={setSupportsComments} />
                        <Label htmlFor="comments-switch">Supports Comments</Label>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleSave}>
                    <PlusCircle className="mr-2" />
                    {editingTemplate ? 'Save Changes' : 'Create & Select'}
                </Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </div>
  );
}
