// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

export interface Presentation {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
  type: 'video' | 'slide';
}

export interface PresentationFilter {
  type?: 'video' | 'slide';
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
} 