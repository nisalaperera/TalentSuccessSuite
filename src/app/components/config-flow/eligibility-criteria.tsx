'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Upload, X } from 'lucide-react';
import type { StepProps, ExclusionRule } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type RuleType = 'Person Type' | 'Department' | 'Legal Entity';

export function EligibilityCriteria({ state, dispatch, onComplete }: StepProps) {
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
    dispatch({ type: 'ADD_ELIGIBILITY', payload: { id: `elig-${Date.now()}`, name: eligibilityName, rules } });
    toast({ title: "Success", description: `Eligibility configuration "${eligibilityName}" saved.` });
    setEligibilityName('');
    setRules([]);
  };
  
  const getLovForType = (type: RuleType | undefined) => {
    if (!type) return [];
    const map = { 'Person Type': state.lovs.personTypes, 'Department': state.lovs.departments, 'Legal Entity': state.lovs.legalEntities };
    return map[type];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Define Eligibility Criteria</CardTitle>
          <CardDescription>Define a named set of exclusion rules. Employees matching any rule will be ineligible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

            <div className="flex justify-end">
                <Button onClick={handleSaveEligibility}>Save Eligibility Config</Button>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="font-headline">Current Eligibility Configurations</CardTitle></CardHeader>
        <CardContent>
          {state.eligibility.length > 0 ? (
            state.eligibility.map(e => (
              <div key={e.id} className="p-4 border rounded-lg mb-4">
                <h3 className="font-bold font-headline mb-2">{e.name}</h3>
                {e.rules.map(r => (
                  <p key={r.id} className="text-sm">Exclude if <strong>{r.type}</strong> is one of [{r.values.join(', ')}]</p>
                ))}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No eligibility configurations saved yet.</p>
          )}
        </CardContent>
      </Card>

      {state.eligibility.length > 0 && (
         <div className="flex justify-end">
            <Button onClick={onComplete} variant="default">Next Step</Button>
        </div>
      )}
    </div>
  );
}
