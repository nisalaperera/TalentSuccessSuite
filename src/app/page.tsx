'use client';

import { useReducer, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle } from 'lucide-react';
import type { ConfigState, Action } from '@/lib/types';

import { ReviewPeriod } from '@/app/components/config-flow/review-period';
import { GoalPlan } from '@/app/components/config-flow/goal-plan';
import { DocumentType } from '@/app/components/config-flow/document-type';
import { DocumentSection } from '@/app/components/config-flow/document-section';
import { EvaluationFlow } from '@/app/components/config-flow/evaluation-flow';
import { EligibilityCriteria } from '@/app/components/config-flow/eligibility-criteria';
import { PerformanceDocument } from '@/app/components/config-flow/performance-document';

const initialState: ConfigState = {
  reviewPeriods: [],
  goalPlans: [],
  documentTypes: [],
  documentSections: [],
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
    case 'ADD_DOCUMENT_TYPE':
      return { ...state, documentTypes: [...state.documentTypes, action.payload] };
    case 'SET_DOCUMENT_SECTIONS':
      return { ...state, documentSections: action.payload };
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
  'reviewPeriod', 'goalPlan', 'documentType', 'documentSection', 'evaluationFlow', 'eligibility', 'performanceDocument'
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
      case 'documentType': return state.documentTypes.length > 0;
      case 'documentSection': return state.documentSections.length > 0;
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

            <AccordionItem value="documentType" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('goalPlan')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                   <div className="flex items-center gap-4">
                    {getStepStatusIcon('documentType')}
                    3. Document Type Setup
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <DocumentType state={state} dispatch={dispatch} onComplete={() => handleNext('documentType')} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="documentSection" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('documentType')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
                   <div className="flex items-center gap-4">
                    {getStepStatusIcon('documentSection')}
                    4. Document Section Setup
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                  <DocumentSection state={state} dispatch={dispatch} onComplete={() => handleNext('documentSection')} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="evaluationFlow" className="border-none">
                <AccordionTrigger disabled={!isStepComplete('documentSection')} className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline">
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
