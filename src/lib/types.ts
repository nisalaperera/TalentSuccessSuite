export type ReviewPeriod = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Inactive';
};

export type GoalPlan = {
  id: string;
  name: string;
  reviewPeriodId: string;
};

export type PerformanceTemplate = {
  id: string;
  name: string;
  category: 'Performance' | 'Survey';
  supportsRatings: boolean;
  supportsComments: boolean;
  status: 'Active' | 'Inactive';
};

export type AccessPermission = {
  role: string;
  view: boolean;
  edit: boolean;
};

export type PerformanceTemplateSection = {
  id: string;
  name: string;
  type: 'Performance Goals' | 'Overall Summary' | 'Survey Question Group' | 'Rating Only' | 'Comment Only' | 'Mixed Feedback';
  performanceTemplateId: string;
  ratingScale?: number;
  permissions: AccessPermission[];
};

export type EvaluationStep = {
  id: string;
  sequence: number;
  task: 'Worker Self-Evaluation' | 'Manager Evaluation' | 'Normalization' | 'Share Document' | 'Confirm Review Meeting' | 'Provide Final Feedback' | 'Close Document';
  role: 'Primary (Worker)' | 'Secondary (Manager)' | 'Sec. Appraiser 1' | 'Sec. Appraiser 2' | 'HR / Dept Head';
  flowType: 'Start' | 'Parallel' | 'Sequential';
  startDate?: Date;
  endDate?: Date;
};

export type EvaluationFlow = {
  id:string;
  name: string;
  steps: EvaluationStep[];
};

export type ExclusionRule = {
    id: string;
    type: 'Person Type' | 'Department' | 'Legal Entity' | 'Employee List';
    values: string[];
};

export type Eligibility = {
    id: string;
    name: string;
    rules: ExclusionRule[];
};

export type PerformanceDocument = {
  id: string;
  name: string;
  reviewPeriodId: string;
  goalPlanId: string;
  performanceTemplateId: string;
  sectionIds: string[];
  evaluationFlowId: string;
  eligibilityId: string;
  managerRatingEnabled: boolean;
  employeeRatingEnabled: boolean;
  managerCommentsEnabled: boolean;
  employeeCommentsEnabled: boolean;
};

export type LOVs = {
  personTypes: string[];
  departments: string[];
  legalEntities: string[];
};

export type ConfigState = {
  reviewPeriods: ReviewPeriod[];
  goalPlans: GoalPlan[];
  performanceTemplates: PerformanceTemplate[];
  performanceTemplateSections: PerformanceTemplateSection[];
  evaluationFlows: EvaluationFlow[];
  eligibility: Eligibility[];
  performanceDocuments: PerformanceDocument[];
  lovs: LOVs;
};

export type Action =
  | { type: 'ADD_REVIEW_PERIOD'; payload: ReviewPeriod }
  | { type: 'ADD_GOAL_PLAN'; payload: GoalPlan }
  | { type: 'ADD_PERFORMANCE_TEMPLATE'; payload: PerformanceTemplate }
  | { type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS'; payload: PerformanceTemplateSection[] }
  | { type: 'ADD_EVALUATION_FLOW'; payload: EvaluationFlow }
  | { type: 'ADD_ELIGIBILITY'; payload: Eligibility }
  | { type: 'ADD_PERFORMANCE_DOCUMENT'; payload: PerformanceDocument }
  | { type: 'ADD_LOV_VALUE'; payload: { lovType: keyof LOVs; value: string } };

export interface StepProps {
    state: ConfigState;
    dispatch: React.Dispatch<Action>;
    onComplete: () => void;
}
