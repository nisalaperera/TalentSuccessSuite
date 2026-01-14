
'use client';

import { useReducer, useState, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ReviewPeriod } from '@/app/components/config-flow/review-period';
import { GoalPlan } from '@/app/components/config-flow/goal-plan';
import { PerformanceTemplate } from '@/app/components/config-flow/performance-template';
import { PerformanceTemplateSection } from '@/app/components/config-flow/performance-template-section';
import { EvaluationFlow } from '@/app/components/config-flow/evaluation-flow';
import { EligibilityCriteria } from '@/app/components/config-flow/eligibility-criteria';
import { PerformanceDocument } from '@/app/components/config-flow/performance-document';
import { TileBasedApproach } from '@/app/components/tile-based-approach';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { configReducer, initialState } from '@/lib/state';
import { PerformanceCycle } from '@/app/components/config-flow/performance-cycle';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import type { 
    ConfigState,
    ReviewPeriod as ReviewPeriodType, 
    PerformanceCycle as PerformanceCycleType, 
    GoalPlan as GoalPlanType, 
    PerformanceTemplate as PerformanceTemplateType, 
    PerformanceTemplateSection as PerformanceTemplateSectionType, 
    EvaluationFlow as EvaluationFlowType, 
    Eligibility as EligibilityType, 
    PerformanceDocument as PerformanceDocumentType,
    Employee as EmployeeType,
    LOVs
} from '@/lib/types';


export default function AdminPage() {
    const firestore = useFirestore();
    const [legacyState, dispatch] = useReducer(configReducer, initialState); // Kept for LOVs and non-db state for now

    // Data Hooks
    const { data: reviewPeriods } = useCollection<ReviewPeriodType>(useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]));
    const { data: performanceCycles } = useCollection<PerformanceCycleType>(useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]));
    const { data: goalPlans } = useCollection<GoalPlanType>(useMemoFirebase(() => collection(firestore, 'goal_plans'), [firestore]));
    const { data: performanceTemplates } = useCollection<PerformanceTemplateType>(useMemoFirebase(() => collection(firestore, 'performance_templates'), [firestore]));
    const { data: performanceTemplateSections } = useCollection<PerformanceTemplateSectionType>(useMemoFirebase(() => collection(firestore, 'performance_template_sections'), [firestore]));
    const { data: evaluationFlows } = useCollection<EvaluationFlowType>(useMemoFirebase(() => collection(firestore, 'evaluation_flows'), [firestore]));
    const { data: eligibility } = useCollection<EligibilityType>(useMemoFirebase(() => collection(firestore, 'eligibility_criteria'), [firestore]));
    const { data: performanceDocuments } = useCollection<PerformanceDocumentType>(useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]));
    const { data: employees } = useCollection<EmployeeType>(useMemoFirebase(() => collection(firestore, 'employees'), [firestore]));

    const state: ConfigState = useMemo(() => ({
        reviewPeriods: (reviewPeriods || []).map(d => ({...d, startDate: d.startDate instanceof Timestamp ? d.startDate.toDate() : d.startDate, endDate: d.endDate instanceof Timestamp ? d.endDate.toDate() : d.endDate})),
        performanceCycles: (performanceCycles || []).map(d => ({...d, startDate: d.startDate instanceof Timestamp ? d.startDate.toDate() : d.startDate, endDate: d.endDate instanceof Timestamp ? d.endDate.toDate() : d.endDate})),
        goalPlans: goalPlans || [],
        performanceTemplates: performanceTemplates || [],
        performanceTemplateSections: performanceTemplateSections || [],
        evaluationFlows: (evaluationFlows || []).map(d => ({ ...d, steps: (d.steps || []).map(s => ({...s, startDate: s.startDate instanceof Timestamp ? s.startDate.toDate() : s.startDate, endDate: s.endDate instanceof Timestamp ? s.endDate.toDate() : s.endDate}))})),
        eligibility: eligibility || [],
        performanceDocuments: performanceDocuments || [],
        employees: employees || [],
        lovs: legacyState.lovs,
    }), [reviewPeriods, performanceCycles, goalPlans, performanceTemplates, performanceTemplateSections, evaluationFlows, eligibility, performanceDocuments, employees, legacyState.lovs]);

  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>('item-1');
  const [selectedReviewPeriodId, setSelectedReviewPeriodId] = useState<string>();
  const [selectedPerformanceCycleId, setSelectedPerformanceCycleId] = useState<string>();
  const [selectedGoalPlanId, setSelectedGoalPlanId] = useState<string>();
  const [selectedPerformanceTemplateId, setSelectedPerformanceTemplateId] = useState<string>();
  const [selectedEvaluationFlowId, setSelectedEvaluationFlowId] = useState<string>();
  const [selectedEligibilityId, setSelectedEligibilityId] = useState<string>();
  const [isSinglePage, setIsSinglePage] = useState(true);

  const selectedReviewPeriod = state.reviewPeriods.find(p => p.id === selectedReviewPeriodId);
  const selectedGoalPlan = state.goalPlans.find(p => p.id === selectedGoalPlanId);
  const selectedPerformanceCycle = state.performanceCycles.find(p => p.id === selectedPerformanceCycleId);
  const selectedPerformanceTemplate = state.performanceTemplates.find(p => p.id === selectedPerformanceTemplateId);
  const selectedTemplateSectionNames = state.performanceTemplateSections
    .filter(s => s.performanceTemplateId === selectedPerformanceTemplateId)
    .map(s => s.name)
    .join(', ');
  const selectedEvaluationFlow = state.evaluationFlows.find(f => f.id === selectedEvaluationFlowId);
  const selectedEligibility = state.eligibility.find(e => e.id === selectedEligibilityId);
  

  const handleStepComplete = (nextItemId: string) => {
    setActiveAccordionItem(nextItemId);
  };
  
  const groupedConfigSteps = [
    {
      groupTitle: "Review Periods, Cycles, and Goals",
      steps: [
        {
          id: 'item-1',
          title: 'Review Period Setup',
          selection: selectedReviewPeriod?.name,
          content: <ReviewPeriod state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-2')} selectedReviewPeriodId={selectedReviewPeriodId} setSelectedReviewPeriodId={setSelectedReviewPeriodId} />
        },
        {
          id: 'item-2',
          title: 'Performance Cycle Setup',
          selection: selectedPerformanceCycle?.name,
          disabled: !selectedReviewPeriodId,
          content: <PerformanceCycle state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-3')} selectedReviewPeriodId={selectedReviewPeriodId} selectedPerformanceCycleId={selectedPerformanceCycleId} setSelectedPerformanceCycleId={setSelectedPerformanceCycleId}/>
        },
        {
          id: 'item-3',
          title: 'Goal Plan Setup',
          selection: selectedGoalPlan?.name,
          disabled: !selectedReviewPeriodId,
          content: <GoalPlan state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-4')} selectedReviewPeriodId={selectedReviewPeriodId} selectedGoalPlanId={selectedGoalPlanId} setSelectedGoalPlanId={setSelectedGoalPlanId} />
        },
      ]
    },
    {
      groupTitle: "Performance Template Management",
      steps: [
        {
          id: 'item-4',
          title: 'Performance Template',
          selection: selectedPerformanceTemplate?.name,
          content: <PerformanceTemplate state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-5')} selectedPerformanceTemplateId={selectedPerformanceTemplateId} setSelectedPerformanceTemplateId={setSelectedPerformanceTemplateId} />
        },
        {
          id: 'item-5',
          title: 'Performance Template Section Setup',
          selection: selectedTemplateSectionNames,
          disabled: !selectedPerformanceTemplateId,
          content: <PerformanceTemplateSection state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-6')} selectedPerformanceTemplateId={selectedPerformanceTemplateId} />
        },
      ]
    },
    {
      groupTitle: "Evaluation Flows and Eligilibilty",
      steps: [
        {
          id: 'item-6',
          title: 'Evaluation Flow',
          selection: selectedEvaluationFlow?.name,
          content: <EvaluationFlow state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-7')} selectedEvaluationFlowId={selectedEvaluationFlowId} setSelectedEvaluationFlowId={setSelectedEvaluationFlowId} />
        },
         {
          id: 'item-7',
          title: 'Eligibility Criteria',
          selection: selectedEligibility?.name,
          content: <EligibilityCriteria state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-8')} selectedEligibilityId={selectedEligibilityId} setSelectedEligibilityId={setSelectedEligibilityId} />
        },
      ]
    },
    {
      groupTitle: "Performance Cycle Config",
      steps: [
        {
          id: 'item-8',
          title: 'Performance Cycle Document',
          content: <PerformanceDocument state={state} dispatch={dispatch} onComplete={() => {}} />
        }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-6">
        <div className="flex justify-end items-center mb-4">
             <div className="flex items-center space-x-2">
                <Label htmlFor="view-mode-switch">Single Page View</Label>
                <Switch id="view-mode-switch" checked={isSinglePage} onCheckedChange={setIsSinglePage} />
             </div>
          </div>
        
        {!isSinglePage ? (
            <TileBasedApproach state={state} />
        ) : (
             <Accordion type="single" value={activeAccordionItem} onValueChange={setActiveAccordionItem} collapsible className="w-full space-y-8">
                {groupedConfigSteps.map(group => (
                  <div key={group.groupTitle}>
                    <h2 className="text-2xl font-headline font-semibold mb-4">{group.groupTitle}</h2>
                    {group.steps.map(step => (
                      <AccordionItem value={step.id} key={step.id} disabled={step.disabled}>
                          <AccordionTrigger>
                          <div className="flex justify-between items-center w-full pr-4">
                              <span className="text-lg font-headline">{step.title}</span>
                              {step.selection && (
                              <div className="flex-shrink w-1/2 text-right whitespace-normal">
                                  <Badge variant="secondary" className="text-sm font-normal">{step.selection}</Badge>
                              </div>
                              )}
                          </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-4">
                          {step.content}
                          </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                ))}
            </Accordion>
        )}
    </div>
  );
}
