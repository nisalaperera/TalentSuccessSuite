
'use client';

import { useReducer, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle } from 'lucide-react';
import type { ConfigState, Action } from '@/lib/types';

import { ReviewPeriod } from '@/app/components/config-flow/review-period';
import { GoalPlan } from '@/app/components/config-flow/goal-plan';
import { PerformanceTemplate } from '@/app/components/config-flow/performance-template';
import { PerformanceTemplateSection } from '@/app/components/config-flow/performance-template-section';
import { EvaluationFlow } from '@/app/components/config-flow/evaluation-flow';
import { EligibilityCriteria } from '@/app/components/config-flow/eligibility-criteria';
import { PerformanceDocument } from '@/app/components/config-flow/performance-document';

const initialState: ConfigState = {
  reviewPeriods: [],
  goalPlans: [],
  performanceTemplates: [],
  performanceTemplateSections: [],
  evaluationFlows: [],
  eligibility: [],
  performanceDocuments: [],
  lovs: {
    personTypes: ['Full-Time', 'Part-Time', 'Intern', 'Contractor'],
    departments: ['Engineering', 'HR', 'Sales', 'Marketing', 'Delivery', 'AMST-VNL-SBU-Core'],
    legalEntities: ['Global Corp', 'US Division', 'EU Division'],
  },
};

function configReducer(state: ConfigState, action: Action): ConfigState {
  switch (action.type) {
    case 'ADD_REVIEW_PERIOD':
      return { ...state, reviewPeriods: [...state.reviewPeriods, action.payload] };
    case 'ADD_GOAL_PLAN':
      return { ...state, goalPlans: [...state.goalPlans, action.payload] };
    case 'ADD_PERFORMANCE_TEMPLATE':
      return { ...state, performanceTemplates: [...state.performanceTemplates, action.payload] };
    case 'SET_PERFORMANCE_TEMPLATE_SECTIONS':
      return { ...state, performanceTemplateSections: action.payload };
    case 'ADD_EVALUATION_FLOW':
      return { ...state, evaluationFlows: [...state.evaluationFlows, action.payload] };
    case 'ADD_ELIGIBILITY':
        return { ...state, eligibility: [...state.eligibility, action.payload] };
    case 'ADD_PERFORMANCE_DOCUMENT':
      return { ...state, performanceDocuments: [...state.performanceDocuments, action.payload] };
    case 'ADD_LOV_VALUE':
      const { lovType, value } = action.payload;
      if (state.lovs[lovType].includes(value)) return state;
      return {
        ...state,
        lovs: {
          ...state.lovs,
          [lovType]: [...state.lovs[lovType], value],
        },
      };
    default:
      return state;
  }
}

const steps = [
  'reviewPeriod', 'goalPlan', 'performanceTemplate', 'performanceTemplateSection', 'evaluationFlow', 'eligibility', 'performanceDocument'
];

export default function Home() {
  const [state, dispatch] = useReducer(configReducer, initialState);
  const [openItem, setOpenItem] = useState('reviewPeriod');

  const handleNext = (currentItem: string) => {
    const currentIndex = steps.indexOf(currentItem);
    if (currentIndex < steps.length - 1) {
      setOpenItem(steps[currentIndex + 1]);
    }
  };

  const isStepComplete = (step: string): boolean => {
    switch (step) {
      case 'reviewPeriod': return state.reviewPeriods.length > 0;
      case 'goalPlan': return state.goalPlans.length > 0;
      case 'performanceTemplate': return state.performanceTemplates.length > 0;
      case 'performanceTemplateSection': return state.performanceTemplateSections.length > 0;
      case 'evaluationFlow': return state.evaluationFlows.length > 0;
      case 'eligibility': return state.eligibility.length > 0;
      default: return false;
    }
  };

  const getStepStatusIcon = (step: string) => {
    return isStepComplete(step) ? (
      <CheckCircle2 className="h-5 w-5 text-accent" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2 tracking-tight">EvalFlow</h1>
          <p className="text-lg text-foreground/80 font-body">
            Seamless Performance Management Configuration
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" value={openItem} onValueChange={setOpenItem} className="w-full space-y-4">
            
            <AccordionItem value="reviewPeriod" className="border-none">
                <AccordionTrigger className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                  <div className="flex items-center gap-4">
                    {getStepStatusIcon('reviewPeriod')}
                    1. Review Period Management
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <ReviewPeriod state={state} dispatch={dispatch} onComplete={() => handleNext('reviewPeriod')} />
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="goalPlan" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('reviewPeriod')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                   <div className="flex items-center gap-4">
                    {getStepStatusIcon('goalPlan')}
                    2. Goal Plan Configuration
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <GoalPlan state={state} dispatch={dispatch} onComplete={() => handleNext('goalPlan')} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performanceTemplate" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('goalPlan')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                   <div className="flex items-center gap-4">
                    {getStepStatusIcon('performanceTemplate')}
                    3. Performance Template Setup
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <PerformanceTemplate state={state} dispatch={dispatch} onComplete={() => handleNext('performanceTemplate')} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performanceTemplateSection" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('performanceTemplate')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                   <div className="flex items-center gap-4">
                    {getStepStatusIcon('performanceTemplateSection')}
                    4. Performance Template Section Setup
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <PerformanceTemplateSection state={state} dispatch={dispatch} onComplete={() => handleNext('performanceTemplateSection')} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="evaluationFlow" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('performanceTemplateSection')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                  <div className="flex items-center gap-4">
                    {getStepStatusIcon('evaluationFlow')}
                    5. Evaluation Flow Setup
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <EvaluationFlow state={state} dispatch={dispatch} onComplete={() => handleNext('evaluationFlow')} />
                </AccordionContent>
            </AccordionItem>

             <AccordionItem value="eligibility" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('evaluationFlow')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                  <div className="flex items-center gap-4">
                    {getStepStatusIcon('eligibility')}
                    6. Eligibility Criteria Definition
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <EligibilityCriteria state={state} dispatch={dispatch} onComplete={() => handleNext('eligibility')} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performanceDocument" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('eligibility')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                  <div className="flex items-center gap-4">
                    <Circle className="h-5 w-5 text-muted-foreground" />
                    7. Performance Document Setup
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <PerformanceDocument state={state} dispatch={dispatch} onComplete={() => handleNext('performanceDocument')} />
                </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </main>
    </div>
  );
}
