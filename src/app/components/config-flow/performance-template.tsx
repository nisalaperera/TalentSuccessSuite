

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import type { StepProps } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


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
  const { toast } = useToast();

  const handleAddPerformanceTemplate = () => {
    if (!name || !category) {
       toast({
        title: 'Missing Information',
        description: 'Please provide a name and select a category.',
        variant: 'destructive',
      });
      return;
    }

    const newType = {
      id: `pt-${Date.now()}`,
      name,
      category,
      supportsRatings,
      supportsComments,
      status: 'Active' as const,
    };
    dispatch({ type: 'ADD_PERFORMANCE_TEMPLATE', payload: newType });
    setSelectedPerformanceTemplateId(newType.id);
    toast({
      title: 'Success',
      description: `Performance template "${name}" has been created.`,
    });
    setName('');
    setCategory(undefined);
    setIsDialogOpen(false);
    onComplete();
  };
  
  const handleSelection = (id: string) => {
    setSelectedPerformanceTemplateId(id);
    // onComplete(); // This was causing premature closing
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
                    <Button>
                        <PlusCircle className="mr-2" />
                        Add New
                    </Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
            <RadioGroup value={selectedPerformanceTemplateId} onValueChange={handleSelection}>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Performance Template Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Ratings</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {state.performanceTemplates.length > 0 ? (
                        state.performanceTemplates.map((type) => (
                        <TableRow key={type.id} data-state={type.id === selectedPerformanceTemplateId ? 'selected' : 'unselected'}>
                            <TableCell>
                                <RadioGroupItem value={type.id} id={type.id} />
                            </TableCell>
                            <TableCell className="font-medium"><Label htmlFor={type.id}>{type.name}</Label></TableCell>
                            <TableCell>{type.category}</TableCell>
                            <TableCell>{type.supportsRatings ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{type.supportsComments ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{type.status}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={6} className="text-center">No performance templates created yet.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </RadioGroup>
            </CardContent>
        </Card>
        <DialogContent>
             <DialogHeader>
                <DialogTitle className="font-headline">Create New Performance Template</DialogTitle>
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddPerformanceTemplate}>
                    <PlusCircle className="mr-2" />
                    Create & Select
                </Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </div>
  );
}
