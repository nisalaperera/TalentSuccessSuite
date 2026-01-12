
'use client';

import { useReducer, useState } from 'react';
import type { ConfigState, Action } from '@/lib/types';
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


export default function Home() {
  const [state, dispatch] = useReducer(configReducer, initialState);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>('item-1');
  const [selectedReviewPeriodId, setSelectedReviewPeriodId] = useState<string>();
  const [selectedGoalPlanId, setSelectedGoalPlanId] = useState<string>();
  const [selectedPerformanceTemplateId, setSelectedPerformanceTemplateId] = useState<string>();
  const [selectedEvaluationFlowId, setSelectedEvaluationFlowId] = useState<string>();
  const [selectedEligibilityId, setSelectedEligibilityId] = useState<string>();
  const [isSinglePage, setIsSinglePage] = useState(false);

  const selectedReviewPeriod = state.reviewPeriods.find(p => p.id === selectedReviewPeriodId);
  const selectedGoalPlan = state.goalPlans.find(p => p.id === selectedGoalPlanId);
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
      groupTitle: "Review Periods and Goal Plans",
      steps: [
        {
          id: 'item-1',
          title: 'Review Period Setup',
          selection: selectedReviewPeriod?.name,
          content: <ReviewPeriod state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-2')} selectedReviewPeriodId={selectedReviewPeriodId} setSelectedReviewPeriodId={setSelectedReviewPeriodId} />
        },
        {
          id: 'item-2',
          title: 'Goal Plan Setup',
          selection: selectedGoalPlan?.name,
          disabled: !selectedReviewPeriodId,
          content: <GoalPlan state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-3')} selectedReviewPeriodId={selectedReviewPeriodId} selectedGoalPlanId={selectedGoalPlanId} setSelectedGoalPlanId={setSelectedGoalPlanId} />
        },
      ]
    },
    {
      groupTitle: "Performance Template Management",
      steps: [
        {
          id: 'item-3',
          title: 'Performance Template',
          selection: selectedPerformanceTemplate?.name,
          content: <PerformanceTemplate state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-4')} selectedPerformanceTemplateId={selectedPerformanceTemplateId} setSelectedPerformanceTemplateId={setSelectedPerformanceTemplateId} />
        },
        {
          id: 'item-4',
          title: 'Performance Template Section Setup',
          selection: selectedTemplateSectionNames,
          disabled: !selectedPerformanceTemplateId,
          content: <PerformanceTemplateSection state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-5')} selectedPerformanceTemplateId={selectedPerformanceTemplateId} />
        },
      ]
    },
    {
      groupTitle: "Evaluation Flows and Eligilibilty",
      steps: [
        {
          id: 'item-5',
          title: 'Evaluation Flow',
          selection: selectedEvaluationFlow?.name,
          content: <EvaluationFlow state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-6')} selectedEvaluationFlowId={selectedEvaluationFlowId} setSelectedEvaluationFlowId={setSelectedEvaluationFlowId} />
        },
         {
          id: 'item-6',
          title: 'Eligibility Criteria',
          selection: selectedEligibility?.name,
          content: <EligibilityCriteria state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-7')} selectedEligibilityId={selectedEligibilityId} setSelectedEligibilityId={setSelectedEligibilityId} />
        },
      ]
    },
    {
      groupTitle: "Performance Document",
      steps: [
        {
          id: 'item-7',
          title: 'Performance Documents',
          content: <PerformanceDocument state={state} dispatch={dispatch} onComplete={() => {}} />
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2 tracking-tight">EvalFlow</h1>
                <p className="text-lg text-foreground/80 font-body">
                  Seamless Performance Management Configuration
                </p>
             </div>
             <div className="flex items-center space-x-2">
                <Label htmlFor="view-mode-switch">Single Page View</Label>
                <Switch id="view-mode-switch" checked={isSinglePage} onCheckedChange={setIsSinglePage} />
             </div>
          </div>
        </header>

         <div className="max-w-5xl mx-auto py-6">
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
      </main>
    </div>
  );
}
