// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

export interface ImageSearch {
  presentation_id: string;
  query: string;
  page: number;
  limit: number;
}

export interface ImageGenerate {
  

  prompt: string;
}
export interface IconSearch {
 

  query: string;

  limit: number;

  icon_weight?: string;
}

export interface PreviousGeneratedImagesResponse {
  extras: {
    prompt: string;
    theme_prompt: string | null;
  };
  created_at: string;
  id: string;
  path: string;
  file_url?: string;
}
