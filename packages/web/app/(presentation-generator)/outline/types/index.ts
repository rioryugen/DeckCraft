// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

export interface Template {
  id: string;
  name: string;
  description: string;
  ordered: boolean;
  default?: boolean;
  slides?: any
}

export interface LoadingState {
  message: string;
  isLoading: boolean;
  showProgress: boolean;
  duration: number;
}



export const TABS = {
  OUTLINE: 'outline',
  LAYOUTS: 'layouts'
} as const;

export type TabType = typeof TABS[keyof typeof TABS]; 