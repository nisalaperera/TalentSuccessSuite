

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
  status: 'Active' | 'Inactive';
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

export type SectionType = 
  // Performance
  | 'Performance Goals' 
  | 'Overall Summary' 
  | 'Competencies'
  // Survey
  | 'Survey Question Group'
  | 'Rating'
  // Common
  | 'Comment';


export type PerformanceTemplateSection = {
  id: string;
  name: string;
  type: SectionType;
  performanceTemplateId: string;
  order: number;
  ratingScale?: number;
  permissions: AccessPermission[];

  // Performance Goals Section Attributes
  enableSectionRatings?: boolean;
  enableSectionComments?: boolean;
  sectionRatingMandatory?: boolean;
  sectionCommentMandatory?: boolean;
  enableSectionWeights?: boolean;
  sectionWeight?: number;
  sectionMinimumWeight?: number;
  enableItemRatings?: boolean;
  enableItemComments?: boolean;
  itemRatingMandatory?: boolean;
  itemCommentMandatory?: boolean;
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
  status: 'Active' | 'Inactive';
};

export type ExclusionRule = {
    id: string;
    type: 'Person Type' | 'Department' | 'Legal Entity';
    values: string[];
};

export type Eligibility = {
    id: string;
    name: string;
    rules: ExclusionRule[];
    status: 'Active' | 'Inactive';
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
  | { type: 'UPDATE_REVIEW_PERIOD'; payload: ReviewPeriod }
  | { type: 'DELETE_REVIEW_PERIOD'; payload: string }
  | { type: 'ADD_GOAL_PLAN'; payload: GoalPlan }
  | { type: 'UPDATE_GOAL_PLAN'; payload: GoalPlan }
  | { type: 'DELETE_GOAL_PLAN'; payload: string }
  | { type: 'ADD_PERFORMANCE_TEMPLATE'; payload: PerformanceTemplate }
  | { type: 'UPDATE_PERFORMANCE_TEMPLATE'; payload: PerformanceTemplate }
  | { type: 'DELETE_PERFORMANCE_TEMPLATE'; payload: string }
  | { type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS'; payload: PerformanceTemplateSection[] }
  | { type: 'ADD_EVALUATION_FLOW'; payload: EvaluationFlow }
  | { type: 'UPDATE_EVALUATION_FLOW'; payload: EvaluationFlow }
  | { type: 'DELETE_EVALUATION_FLOW'; payload: string }
  | { type: 'ADD_ELIGIBILITY'; payload: Eligibility }
  | { type: 'UPDATE_ELIGIBILITY'; payload: Eligibility }
  | { type: 'DELETE_ELIGIBILITY'; payload: string }
  | { type: 'ADD_PERFORMANCE_DOCUMENT'; payload: PerformanceDocument }
  | { type: 'ADD_LOV_VALUE'; payload: { lovType: keyof LOVs; value: string } };

export interface StepProps {
    state: ConfigState;
    dispatch: React.Dispatch<Action>;
    onComplete: () => void;
}
