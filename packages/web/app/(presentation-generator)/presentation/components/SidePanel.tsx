// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { setPresentationData } from "@/state/slices/presentationGeneration";
import { SortableSlide } from "./SortableSlide";
import { Separator } from "@/shared/ui/separator";
import { usePathname } from "next/navigation";
import NewSlide from "./NewSlide";
import { trackEvent, MixpanelEvent } from "@/lib/mixpanel";
import { SlideThumbnailCard } from "./SlideThumbnailCard";

interface SidePanelProps {
  selectedSlide: number;
  onSlideClick: (index: number) => void;
  presentationId: string;

  loading: boolean;
}

const SidePanel = ({
  selectedSlide,
  onSlideClick,
  presentationId,

  loading,
}: SidePanelProps) => {
  const pathname = usePathname();
  const [showNewSlideSelection, setShowNewSlideSelection] = useState(false);

  const { presentationData, isStreaming } = useSelector(
    (state: RootState) => state.presentationGeneration
  );

  const dispatch = useDispatch();

  const lastSlideIndex = presentationData?.slides?.length
    ? presentationData.slides.length - 1
    : 0;
  const lastSlideTemplateId = presentationData?.slides?.[lastSlideIndex]?.layout
    ? presentationData.slides[lastSlideIndex].layout.split(":")[0]
    : "";

  const handleAddSlideClick = () => {
    if (!presentationData?.slides?.length || isStreaming) return;
    setShowNewSlideSelection(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after moving 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!active || !over || !presentationData?.slides) return;

    if (active.id !== over.id) {
      // Find the indices of the dragged and target items
      const oldIndex = presentationData?.slides.findIndex(
        (item: any) => item.id === active.id
      );
      const newIndex = presentationData?.slides.findIndex(
        (item: any) => item.id === over.id
      );

      // Reorder the array
      const reorderedArray = arrayMove(
        presentationData?.slides,
        oldIndex,
        newIndex
      );

      // Update indices of all slides
      const updatedArray = reorderedArray.map((slide: any, index: number) => ({
        ...slide,
        index: index,
      }));

      // Update the store with new order and indices
      dispatch(
        setPresentationData({ ...presentationData, slides: updatedArray })
      );
      trackEvent(MixpanelEvent.Presentation_Slides_Reordered, {
        pathname,
        presentation_id: presentationId,
        from_index: oldIndex,
        to_index: newIndex,
        slide_count: updatedArray.length,
      });
    }
  };

  // Loading shimmer component
  if (
    !presentationData ||
    loading ||
    !presentationData?.slides ||
    presentationData?.slides.length === 0
  ) {
    return null;
  }

  const shouldShowNewSlideModal =
    showNewSlideSelection &&
    lastSlideTemplateId &&
    typeof document !== "undefined";

  const newSlideModal = shouldShowNewSlideModal
    ? createPortal(
        <div
          className="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 px-4 py-16"
          onClick={() => setShowNewSlideSelection(false)}
        >
          <div className="relative z-[1001] flex min-h-full items-start justify-center pt-10">
            <div
              className="w-full max-w-[675px]"
              onClick={(event) => event.stopPropagation()}
            >
              <NewSlide
                index={lastSlideIndex}
                templateID={lastSlideTemplateId}
                setShowNewSlideSelection={setShowNewSlideSelection}
                presentationId={presentationId}
              />
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="px-4 w-[120px] h-full">
      <div
        className={`
          relative  h-full z-50 xl:z-auto 
          transition-all duration-300 ease-in-out
        `}
      >
        <div className="w-full h-full hide-scrollbar overflow-hidden slide-theme flex flex-col">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-y-auto w-full hide-scrollbar min-h-0 flex-1 space-y-3.5">
              {isStreaming ? (
                presentationData &&
                presentationData?.slides.map((slide: any, index: number) => (
                  <SlideThumbnailCard
                    key={`${slide.id}-${index}`}
                    slide={slide}
                    index={index}
                    selected={selectedSlide === index}
                    onClick={() => onSlideClick(slide.index ?? index)}
                  />
                ))
              ) : (
                <SortableContext
                  items={
                    presentationData?.slides.map(
                      (slide: any) => slide.id || `${slide.index}`
                    ) || []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {presentationData &&
                    presentationData?.slides.map(
                      (slide: any, index: number) => (
                        <SortableSlide
                          key={`${slide.id}-${index}`}
                          slide={slide}
                          index={index}
                          selectedSlide={selectedSlide}
                          onSlideClick={onSlideClick}
                        />
                      )
                    )}
                </SortableContext>
              )}
            </div>
          </DndContext>
          <Separator orientation="horizontal" className=" " />

          <button
            type="button"
            onClick={handleAddSlideClick}
            className="py-4 gap-2 flex flex-col duration-300 items-center justify-center rounded-lg cursor-pointer mx-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] font-normal text-[#000000]">
              Add Slide
            </span>
          </button>
        </div>
      </div>
      {newSlideModal}
    </div>
  );
};

export default SidePanel;
