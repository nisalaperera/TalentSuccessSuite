import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { useFirestore } from '@/firebase';

import type { ConfigState, Action, ReviewPeriod } from '@/lib/types';

export const initialState: ConfigState = {
  reviewPeriods: [],
  performanceCycles: [],
  goalPlans: [],
  goals: [],
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

export function configReducer(state: ConfigState, action: Action): ConfigState {
  switch (action.type) {
    // These actions are now handled by Firestore directly in the components.
    // This reducer is kept for structure but is no longer the source of truth.
    case 'SET_DATA':
        return { ...state, ...action.payload };
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
