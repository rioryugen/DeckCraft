// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { setPresentationData } from "@/state/slices/presentationGeneration";
import { DashboardApi } from '../../services/api/dashboard';
import { clearHistory } from "@/state/slices/undoRedoSlice";
import { applyPresentationThemeToElement } from "../utils/applyPresentationThemeDom";
import { normalizeBackendAssetUrls } from "@/lib/api";
import { useFontLoader } from "../../hooks/useFontLoad";


export const usePresentationData = (
  presentationId: string,
  setLoading: (loading: boolean) => void,
  setError: (error: boolean) => void
) => {
  const dispatch = useDispatch();

  const fetchUserSlides = useCallback(async (options?: { clearHistory?: boolean }) => {
    try {
      const data = await DashboardApi.getPresentation(presentationId);
      const normalizedData = normalizeBackendAssetUrls(data);


      if (normalizedData) {
        dispatch(setPresentationData(normalizedData));
        if (options?.clearHistory ?? true) {
          dispatch(clearHistory());
        }
        setLoading(false);
      }
      if (normalizedData.fonts) {
        useFontLoader(normalizedData.fonts);
      }
      if (normalizedData?.theme) {
        const el = document.getElementById("presentation-slides-wrapper");
        applyPresentationThemeToElement(el, normalizedData.theme);
      }
    } catch (error) {
      setError(true);
      toast.error("Failed to load presentation");
      console.error("Error fetching user slides:", error);
      setLoading(false);
    }
  }, [presentationId, dispatch, setLoading, setError]);

  return {
    fetchUserSlides,
  };
};
