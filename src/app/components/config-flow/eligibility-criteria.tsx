
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Upload, X } from 'lucide-react';
import type { StepProps, ExclusionRule } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type RuleType = 'Person Type' | 'Department' | 'Legal Entity';

interface EligibilityCriteriaProps extends StepProps {
    selectedEligibilityId?: string;
    setSelectedEligibilityId: (id: string) => void;
}

export function EligibilityCriteria({ state, dispatch, onComplete, selectedEligibilityId, setSelectedEligibilityId }: EligibilityCriteriaProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eligibilityName, setEligibilityName] = useState('');
  const [rules, setRules] = useState<ExclusionRule[]>([]);
  const [newRuleType, setNewRuleType] = useState<RuleType | undefined>();
  const [newRuleValues, setNewRuleValues] = useState<string[]>([]);
  const [newLovValue, setNewLovValue] = useState('');
  const { toast } = useToast();

  const handleAddValueToRule = (value: string) => {
    if (!newRuleType || !value) return;
    if (!newRuleValues.includes(value)) {
        setNewRuleValues([...newRuleValues, value]);
    }
  };

  const handleRemoveValueFromRule = (value: string) => {
    setNewRuleValues(newRuleValues.filter(v => v !== value));
  };
  
  const handleAddRule = () => {
    if (!newRuleType || newRuleValues.length === 0) {
      toast({ title: "Rule type and values are required", variant: "destructive" });
      return;
    }
    setRules([...rules, { id: `rule-${Date.now()}`, type: newRuleType, values: newRuleValues }]);
    setNewRuleType(undefined);
    setNewRuleValues([]);
  };

  const handleAddLov = () => {
    if (!newRuleType || !newLovValue) return;
    const lovMap = { 'Person Type': 'personTypes', 'Department': 'departments', 'Legal Entity': 'legalEntities' };
    dispatch({ type: 'ADD_LOV_VALUE', payload: { lovType: lovMap[newRuleType] as any, value: newLovValue } });
    toast({ title: "Success", description: `Value "${newLovValue}" added to ${newRuleType}.` });
    setNewLovValue('');
  };

  const handleSaveEligibility = () => {
    if (!eligibilityName) {
      toast({ title: "Eligibility configuration name is required", variant: "destructive" });
      return;
    }
    const newEligibility = { id: `elig-${Date.now()}`, name: eligibilityName, rules };
    dispatch({ type: 'ADD_ELIGIBILITY', payload: newEligibility });
    setSelectedEligibilityId(newEligibility.id);
    toast({ title: "Success", description: `Eligibility configuration "${eligibilityName}" saved.` });
    setEligibilityName('');
    setRules([]);
    setIsDialogOpen(false);
    onComplete();
  };
  
  const getLovForType = (type: RuleType | undefined) => {
    if (!type) return [];
    const map = { 'Person Type': state.lovs.personTypes, 'Department': state.lovs.departments, 'Legal Entity': state.lovs.legalEntities };
    return map[type];
  };

  const handleSelection = (id: string) => {
    setSelectedEligibilityId(id);
    onComplete();
  }

  return (
    <div className="space-y-6">
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Eligibility Criteria</CardTitle>
                    <CardDescription>Define named sets of exclusion rules. Employees matching any rule will be ineligible.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2"/>Add New</Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
                <RadioGroup value={selectedEligibilityId} onValueChange={handleSelection}>
                     {state.eligibility.length > 0 ? (
                        state.eligibility.map(e => (
                        <div key={e.id} className="p-4 border rounded-lg mb-4 flex items-center gap-4 data-[state=checked]:bg-muted" data-state={e.id === selectedEligibilityId ? 'checked' : 'unchecked'}>
                            <RadioGroupItem value={e.id} id={`elig-${e.id}`} />
                            <div>
                                <Label htmlFor={`elig-${e.id}`} className="font-bold font-headline mb-2 cursor-pointer">{e.name}</Label>
                                {e.rules.map(r => (
                                <p key={r.id} className="text-sm">Exclude if <strong>{r.type}</strong> is one of [{r.values.join(', ')}]</p>
                                ))}
                            </div>
                        </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No eligibility configurations saved yet.</p>
                    )}
                </RadioGroup>
            </CardContent>
        </Card>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Define Eligibility Criteria</DialogTitle>
                <DialogDescription>Define a named set of exclusion rules. Employees matching any rule will be ineligible.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <Input placeholder="Eligibility Config Name (e.g., 'FY25 Annual Exclusions')" value={eligibilityName} onChange={e => setEligibilityName(e.target.value)} />
                
                <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold font-headline">Add New Exclusion Rule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={(v: RuleType) => { setNewRuleType(v); setNewRuleValues([]); }}>
                    <SelectTrigger><SelectValue placeholder="Exclusion Rule Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Person Type">Person Type</SelectItem>
                        <SelectItem value="Department">Department</SelectItem>
                        <SelectItem value="Legal Entity">Legal Entity</SelectItem>
                    </SelectContent>
                    </Select>
                    <Select onValueChange={handleAddValueToRule} disabled={!newRuleType} value="">
                    <SelectTrigger><SelectValue placeholder="Select Values to Exclude" /></SelectTrigger>
                    <SelectContent>
                        {getLovForType(newRuleType).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>

                {newRuleValues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {newRuleValues.map(val => (
                            <Badge key={val} variant="secondary" className="flex items-center gap-1">
                                {val}
                                <button onClick={() => handleRemoveValueFromRule(val)} className="rounded-full hover:bg-muted-foreground/20">
                                    <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                <Button onClick={handleAddRule} variant="secondary"><PlusCircle className="mr-2"/>Add Rule</Button>

                {newRuleType && (
                    <div className="flex gap-2 items-end pt-4 border-t">
                    <div className="flex-grow">
                        <Label>Add a new value for "{newRuleType}"</Label>
                        <Input placeholder="New value..." value={newLovValue} onChange={e => setNewLovValue(e.target.value)} />
                    </div>
                    <Button onClick={handleAddLov}><PlusCircle className="mr-2"/>Add Value</Button>
                    </div>
                )}
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold font-headline">Upload Employee Exclusion List</h4>
                    <p className="text-sm text-muted-foreground">Upload a list of employees under the "Commercial Transferred (2in1 Box)" category.</p>
                    <div className="flex gap-2 items-center">
                        <Input type="file" className="flex-grow"/>
                        <Button variant="secondary"><Upload className="mr-2"/>Upload</Button>
                    </div>
                </div>

            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEligibility}>Save Eligibility Config</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
