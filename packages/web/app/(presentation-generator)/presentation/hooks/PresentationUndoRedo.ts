// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { redo, undo } from "@/state/slices/undoRedoSlice";
import { useKeyboardShortcut } from "../../hooks/use-keyboard-shortcut";
import { setPresentationData } from "@/state/slices/presentationGeneration";

export const usePresentationUndoRedo = () => {
  const dispatch = useDispatch();
  const undoRedoState = useSelector((state: RootState) => state.undoRedo);
  const { presentationData } = useSelector(
    (state: RootState) => state.presentationGeneration
  );

  const canUndo = undoRedoState.past.length > 0;
  const canRedo = undoRedoState.future.length > 0;

  const applySlidesSnapshot = useCallback(
    (slidesSnapshot: unknown) => {
      if (!presentationData || !Array.isArray(slidesSnapshot)) {
        return;
      }

      const clonedSlides = JSON.parse(JSON.stringify(slidesSnapshot));
      dispatch(
        setPresentationData({
          ...presentationData,
          slides: clonedSlides,
        })
      );
    },
    [dispatch, presentationData]
  );

  const onUndo = useCallback(() => {
    if (!canUndo) {
      return;
    }

    const previousState = undoRedoState.past[undoRedoState.past.length - 1];
    if (!previousState) {
      return;
    }

    dispatch(undo());
    applySlidesSnapshot(previousState.slides);
  }, [applySlidesSnapshot, canUndo, dispatch, undoRedoState.past]);

  const onRedo = useCallback(() => {
    if (!canRedo) {
      return;
    }

    const nextState = undoRedoState.future[0];
    if (!nextState) {
      return;
    }

    dispatch(redo());
    applySlidesSnapshot(nextState.slides);
  }, [applySlidesSnapshot, canRedo, dispatch, undoRedoState.future]);

  // Handle undo (Ctrl + Z)
  useKeyboardShortcut(
    ["z"],
    (e) => {
      if (e.ctrlKey && !e.shiftKey && canUndo) {
        e.preventDefault();
        onUndo();
      }
    },
    [canUndo, onUndo]
  );

  // Handle redo (Ctrl + Shift + Z)
  useKeyboardShortcut(
    ["z"],
    (e) => {
      if (e.ctrlKey && e.shiftKey && canRedo) {
        e.preventDefault();
        onRedo();
      }
    },
    [canRedo, onRedo]
  );

  // Handle redo (Ctrl + Y)
  useKeyboardShortcut(
    ["y"],
    (e) => {
      if (e.ctrlKey && canRedo) {
        e.preventDefault();
        onRedo();
      }
    },
    [canRedo, onRedo]
  );

  return { onUndo, onRedo, canUndo, canRedo };
};