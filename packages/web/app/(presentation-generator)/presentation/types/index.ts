// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

export interface PresentationState {
  loading: boolean;
  selectedSlide: number;
  isFullscreen: boolean;
  error: boolean;
  isMobilePanelOpen: boolean;
  autoSaveLoading: boolean;
}

export interface StreamState {
  isStreaming: boolean;
}

export interface PresentationPageProps {
  presentation_id: string;
} 