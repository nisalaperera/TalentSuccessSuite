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

export function DocumentType({ state, dispatch, onComplete }: StepProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Performance' | 'Survey' | undefined>();
  const [supportsRatings, setSupportsRatings] = useState(true);
  const [supportsComments, setSupportsComments] = useState(true);
  const { toast } = useToast();

  const handleAddDocumentType = () => {
    if (!name || !category) {
       toast({
        title: 'Missing Information',
        description: 'Please provide a name and select a category.',
        variant: 'destructive',
      });
      return;
    }

    const newType = {
      id: `dt-${Date.now()}`,
      name,
      category,
      supportsRatings,
      supportsComments,
      status: 'Active' as const,
    };
    dispatch({ type: 'ADD_DOCUMENT_TYPE', payload: newType });
    toast({
      title: 'Success',
      description: `Document type "${name}" has been created.`,
    });
    setName('');
    setCategory(undefined);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Create New Document Type</CardTitle>
          <CardDescription>Define what kind of document is being created and how it behaves.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Button onClick={handleAddDocumentType}>
            <PlusCircle className="mr-2" />
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Existing Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ratings</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.documentTypes.length > 0 ? (
                state.documentTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.category}</TableCell>
                    <TableCell>{type.supportsRatings ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{type.supportsComments ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{type.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No document types created yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {state.documentTypes.length > 0 && (
         <div className="flex justify-end">
            <Button onClick={onComplete} variant="default">Next Step</Button>
        </div>
      )}
    </div>
  );
}
