
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Check, X } from 'lucide-react';
import type { StepProps, PerformanceTemplateSection as PerformanceTemplateSectionType, AccessPermission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './shared/star-rating';

const allSectionTemplates = [
    { name: 'Performance Goals', type: 'Performance Goals', docCategory: 'Performance' },
    { name: 'Overall Summary', type: 'Overall Summary', docCategory: 'Performance' },
    { name: 'Survey Question Group', type: 'Survey Question Group', docCategory: 'Survey' },
    { name: 'Rating Only Section', type: 'Rating Only', docCategory: 'Survey' },
    { name: 'Comment Only Section', type: 'Comment Only', docCategory: 'Survey' },
];

const ROLES = ['Worker', 'Primary Appraiser', 'Secondary Appraiser 1', 'Secondary Appraiser 2', 'HR / Department Head'];

interface PerformanceTemplateSectionProps extends StepProps {
    selectedPerformanceTemplateId?: string;
}

export function PerformanceTemplateSection({ state, dispatch, onComplete, selectedPerformanceTemplateId }: PerformanceTemplateSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [ratingScale, setRatingScale] = useState(5);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const { toast } = useToast();

  const handleSetupClick = (sectionTemplate: any) => {
    setCurrentSection(sectionTemplate);
    const initialPermissions = ROLES.map(role => ({ role, view: true, edit: false }));
    setPermissions(initialPermissions);
    setIsDialogOpen(true);
  };
  
  const handlePermissionChange = (role: string, key: 'view' | 'edit', value: boolean) => {
    setPermissions(prev => prev.map(p => p.role === role ? {...p, [key]: value} : p));
  };

  const handleSaveSection = () => {
    if (!currentSection || !selectedPerformanceTemplateId) return;

    const newSection: PerformanceTemplateSectionType = {
        id: `ds-${Date.now()}`,
        name: currentSection.name,
        type: currentSection.type,
        performanceTemplateId: selectedPerformanceTemplateId,
        ratingScale,
        permissions
    };
    
    // Check if section with same name and type already exists for this doc type
    const existingSectionIndex = state.performanceTemplateSections.findIndex(
      s => s.name === newSection.name && s.type === newSection.type && s.performanceTemplateId === newSection.performanceTemplateId
    );

    let updatedSections = [...state.performanceTemplateSections];
    if(existingSectionIndex > -1) {
      updatedSections[existingSectionIndex] = newSection;
    } else {
      updatedSections.push(newSection);
    }
    
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: updatedSections });
    toast({
        title: 'Success',
        description: `Configuration for "${currentSection.name}" has been saved.`,
    });
    setIsDialogOpen(false);
    setCurrentSection(null);
  };

  const filteredSections = useMemo(() => {
    if (!selectedPerformanceTemplateId) return [];
    const docType = state.performanceTemplates.find(dt => dt.id === selectedPerformanceTemplateId);
    if (!docType) return [];
    return allSectionTemplates.filter(st => st.docCategory === docType.category);
  }, [selectedPerformanceTemplateId, state.performanceTemplates]);

  const isSectionConfigured = (sectionName: string) => {
    return state.performanceTemplateSections.some(s => s.name === sectionName && s.performanceTemplateId === selectedPerformanceTemplateId);
  };
  
  const selectedTemplate = state.performanceTemplates.find(t => t.id === selectedPerformanceTemplateId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Configure Sections for: {selectedTemplate?.name || '...'}</CardTitle>
          <CardDescription>Set up the individual content blocks for the selected performance template.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSections.map(template => (
                <Card key={template.name}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-headline text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.type}</CardDescription>
                    </div>
                    {isSectionConfigured(template.name) ? <Check className="text-accent" /> : <X className="text-destructive" />}
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handleSetupClick(template)}>
                      <Settings className="mr-2 h-4 w-4" />
                      {isSectionConfigured(template.name) ? 'Edit Setup' : 'Setup'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Configure: {currentSection?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            
            <Card>
                <CardHeader><CardTitle>Rating Scale</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Label htmlFor="rating-scale">Star Rating Maximum (N)</Label>
                    <Input id="rating-scale" type="number" value={ratingScale} onChange={e => setRatingScale(parseInt(e.target.value, 10))} min="1" max="10"/>
                    <Label>Example:</Label>
                    <StarRating count={ratingScale} value={Math.ceil(ratingScale/2)} onChange={()=>{}}/>
                </CardContent>
            </Card>
            
            {currentSection?.type === 'Overall Summary' &&
                <Card>
                    <CardHeader><CardTitle>Overall Normalized Rating Weights</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Configure weights for blending scores.</p>
                        <Label>Current Document Score Weights</Label>
                        <div className="flex gap-4">
                            <Input type="number" placeholder="Primary Appraiser Weight % (e.g., 70)" />
                            <Input type="number" placeholder="Secondary Appraisers Weight % (e.g., 30)" />
                        </div>
                        <Label>Final Overall Normalized Rating Weights</Label>
                        <div className="flex gap-4">
                            <Input type="number" placeholder="Current Performance Weight % (e.g., 70)" />
                            <Input type="number" placeholder="Historical Performance Weight % (e.g., 30)" />
                        </div>
                    </CardContent>
                </Card>
            }

            <Card>
                <CardHeader><CardTitle>Section Access & Permissions</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-center">View</TableHead>
                                <TableHead className="text-center">Rate / Edit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {permissions.map(({role, view, edit}) => (
                                <TableRow key={role}>
                                    <TableCell className="font-medium">{role}</TableCell>
                                    <TableCell className="text-center"><Switch checked={view} onCheckedChange={(val) => handlePermissionChange(role, 'view', val)}/></TableCell>
                                    <TableCell className="text-center"><Switch checked={edit} onCheckedChange={(val) => handlePermissionChange(role, 'edit', val)}/></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {state.performanceTemplateSections.length > 0 && (
         <div className="flex justify-end mt-6">
            <Button onClick={onComplete} variant="default">Next Step</Button>
        </div>
      )}
    </div>
  );
}
