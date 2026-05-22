// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Input } from "@/shared/ui/input";
import { Search, ChevronRight, Info } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import ToolTip from "@/shared/ToolTip";
import { cn } from "@/lib/utils";
import type { RootState } from "@/state/store";
import { setPresentationData } from "@/state/slices/presentationGeneration";
import { useDispatch, useSelector } from "react-redux";
import { PresentationGenerationApi } from "../services/api/presentation-generation";
import { toast } from "sonner";

const ICON_WEIGHTS = [
  "thin",
  "light",
  "regular",
  "bold",
  "fill",
  "duotone",
] as const;

type IconWeight = (typeof ICON_WEIGHTS)[number];

const DEFAULT_ICON_WEIGHT: IconWeight = "regular";
const ICON_WEIGHT_PATTERN = ICON_WEIGHTS.join("|");
const ICON_SEARCH_DEBOUNCE_MS = 500;

const ICON_WEIGHT_LABELS: Record<IconWeight, string> = {
  thin: "Thin",
  light: "Light",
  regular: "Regular",
  bold: "Bold",
  fill: "Fill",
  duotone: "Duotone",
};

const normalizeIconWeight = (weight?: string | null): IconWeight => {
  const normalized = (weight || "").trim().toLowerCase().replace(/_/g, "-");

  return ICON_WEIGHTS.includes(normalized as IconWeight)
    ? (normalized as IconWeight)
    : DEFAULT_ICON_WEIGHT;
};

const getIconWeightFromUrl = (url?: string | null) => {
  const match = (url || "").match(/\/static\/icons\/([^/]+)\//);
  return normalizeIconWeight(match?.[1]);
};

const replaceIconWeightInUrl = (
  url: string | null | undefined,
  weight: string
) => {
  if (!url) return "";

  const normalizedWeight = normalizeIconWeight(weight);
  const iconPathPattern = new RegExp(
    `(/static/icons/)([^/]+)/([^/?#]+?)(?:-(${ICON_WEIGHT_PATTERN}))?(\\.(?:svg|png))([?#].*)?$`,
    "i"
  );

  return url.replace(
    iconPathPattern,
    (_match, prefix, _folder, iconName, _suffix, extension, trailing = "") =>
      `${prefix}${normalizedWeight}/${iconName}${
        normalizedWeight === "regular" ? "" : `-${normalizedWeight}`
      }${extension}${trailing}`
  );
};

const clonePresentationData = <T,>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
};

const applyIconWeightToValue = (value: any, weight: IconWeight): any => {
  if (typeof value === "string") {
    return value.includes("/static/icons/")
      ? replaceIconWeightInUrl(value, weight)
      : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyIconWeightToValue(item, weight));
  }

  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      value[key] = applyIconWeightToValue(value[key], weight);
    });
  }

  return value;
};

const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
};

interface IconsEditorProps {
  icon_prompt?: string[] | null;
  currentIconUrl?: string;
  onClose?: () => void;
  onIconChange?: (newIconUrl: string, query?: string) => void;
}

const IconsEditor = ({
  icon_prompt,
  currentIconUrl,
  onClose,
  onIconChange,
}: IconsEditorProps) => {
  const dispatch = useDispatch();
  const presentationData = useSelector(
    (state: RootState) => state.presentationGeneration.presentationData
  );
  const requestIdRef = useRef(0);
  const closeTimeoutRef = useRef<number | null>(null);

  const [icons, setIcons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(
    icon_prompt?.[0] || ""
  );
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState<IconWeight>(
    normalizeIconWeight(getIconWeightFromUrl(currentIconUrl))
  );
  const [selectedIconUrl, setSelectedIconUrl] = useState(currentIconUrl || "");
  const [applyStylesToPresentation, setApplyStylesToPresentation] =
    useState(false);

  const activeQuery = useMemo(
    () => searchQuery.trim() || icon_prompt?.[0] || "",
    [icon_prompt, searchQuery]
  );
  const debouncedActiveQuery = useDebouncedValue(
    activeQuery,
    ICON_SEARCH_DEBOUNCE_MS
  );

  const previewIconSource = selectedIconUrl || currentIconUrl || icons[0] || "";

  useEffect(() => {
    setSelectedIconUrl(currentIconUrl || "");
    setSelectedWeight(
      normalizeIconWeight(getIconWeightFromUrl(currentIconUrl))
    );
  }, [currentIconUrl]);

  useEffect(() => {
    if (!selectedIconUrl && icons.length > 0) {
      setSelectedIconUrl(icons[0]);
    }
  }, [icons, selectedIconUrl]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      onClose?.();
    }, 300);
  }, [onClose]);

  const handleIconSearch = useCallback(
    async (weightOverride?: IconWeight, queryOverride?: string) => {
      const query = (queryOverride || "").trim();
      const weight = normalizeIconWeight(weightOverride || selectedWeight);
      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;

      if (!query) {
        setIcons([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await PresentationGenerationApi.searchIcons({
          query,
          limit: 40,
          icon_weight: weight,
        });

        if (requestIdRef.current === requestId) {
          setIcons(Array.isArray(data) ? data : []);
        }
      } catch (error: any) {
        if (requestIdRef.current === requestId) {
          console.error("Error fetching icons:", error);
          toast.error(
            error.message || "Failed to fetch icons. Please try again."
          );
          setIcons([]);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [selectedWeight]
  );

  useEffect(() => {
    handleIconSearch(selectedWeight, debouncedActiveQuery);
  }, [debouncedActiveQuery, handleIconSearch, selectedWeight]);

  const handleWeightSelect = (weight: IconWeight) => {
    setSelectedWeight(weight);
    setSelectedIconUrl((previousIcon) => {
      const sourceIcon = previousIcon || currentIconUrl || "";
      return sourceIcon ? replaceIconWeightInUrl(sourceIcon, weight) : "";
    });
  };

  const handleReplaceIcons = () => {
    const replacementIcon = replaceIconWeightInUrl(
      selectedIconUrl || currentIconUrl,
      selectedWeight
    );

    if (!replacementIcon) {
      toast.error("Select an icon before replacing.");
      return;
    }

    if (applyStylesToPresentation && presentationData) {
      const nextPresentationData = clonePresentationData(presentationData);
      dispatch(
        setPresentationData(
          applyIconWeightToValue(nextPresentationData, selectedWeight)
        )
      );
    }

    onIconChange?.(replacementIcon, activeQuery);
    handleClose();
  };

  return (
    <div className="icons-editor-container">
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full w-[370px] max-w-[calc(100vw-16px)] flex-col gap-0 border-l border-[#EDEEEF] bg-white p-0 font-syne shadow-xl sm:max-w-[370px] [&>button]:right-4 [&>button]:top-4"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader className="border-b border-[#EDEEEF] px-4 py-4 text-left">
            <SheetTitle className="text-sm font-semibold text-[#191919]">
              Icon Customizer
            </SheetTitle>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="space-y-3.5 px-4 py-[18px]">
              <div className="pb-5">
                <div className="mb-[15px] flex items-center gap-1.5">
                  <p className="text-sn font-normal text-[#191919]">
                    Icon Weight
                  </p>
                  <ToolTip content="Choose the visual weight used for icon search and replacement.">
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center text-[#A1A1AA]"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </ToolTip>
                </div>

                <div className="flex items-center justify-between">
                  {ICON_WEIGHTS.map((weight) => {
                    const isSelected = selectedWeight === weight;
                    const previewIcon = previewIconSource
                      ? replaceIconWeightInUrl(previewIconSource, weight)
                      : "";

                    return (
                      <button
                        key={weight}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeightSelect(weight);
                        }}
                        className="group flex min-w-0 flex-col items-center gap-1"
                      >
                        <span
                          className={cn(
                            "flex h-[45px] w-[48px] items-center justify-center rounded-[8px] border  transition-colors",
                            isSelected
                              ? "border-[#D9D6FE] bg-[#F4F3FF]"
                              : "border-[#EDEEEF] bg-white group-hover:bg-[#F7F7FA]"
                          )}
                        >
                          {previewIcon ? (
                            <img
                              src={previewIcon}
                              alt=""
                              draggable={false}
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <span className="h-4 w-4 rounded-full border border-[#191919]" />
                          )}
                        </span>
                        <span
                          className={cn(
                            "truncate text-xs ",
                            isSelected ? "text-[#7A5AF8]" : "text-[#666666]"
                          )}
                        >
                          {ICON_WEIGHT_LABELS[weight]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pb-5">
                <p className="text-sm font-medium text-[#191919] ">
                  Apply styles to entire presentation
                </p>
                <Switch
                  checked={applyStylesToPresentation}
                  onCheckedChange={setApplyStylesToPresentation}
                  className="h-5 w-9 data-[state=checked]:bg-[#7C3AED] data-[state=unchecked]:bg-[#DDDEE3]"
                />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleIconSearch(selectedWeight, activeQuery);
                }}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9CA3]" />
                  <Input
                    placeholder="Find an Icon"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-10 rounded-[8px] border-[#E4E5E8] bg-white pl-9 text-[12px] text-[#191919] shadow-none placeholder:text-[#A3A3AA] focus-visible:ring-1 focus-visible:ring-[#D8C8FF]"
                  />
                </div>
              </form>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="grid grid-cols-4 justify-items-center gap-x-4 gap-y-5 py-1">
                  {Array.from({ length: 32 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-8 rounded-[8px]" />
                  ))}
                </div>
              ) : icons.length > 0 ? (
                <div className="grid grid-cols-4 justify-items-center gap-x-4 gap-y-5 py-1">
                  {icons.map((iconSrc, index) => {
                    const isSelected = iconSrc === selectedIconUrl;

                    return (
                      <button
                        key={`${iconSrc}-${index}`}
                        type="button"
                        aria-label={`Select icon ${index + 1}`}
                        aria-pressed={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIconUrl(iconSrc);
                        }}
                        className={cn(
                          "flex h-9 w-9 p-1 items-center justify-center rounded-[8px] border border-transparent  transition-colors hover:bg-[#F6F6F9]",
                          isSelected && "border-[#becff5] bg-[#e4ecfd]"
                        )}
                      >
                        <img
                          src={iconSrc}
                          alt=""
                          draggable={false}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-44 flex-col items-center justify-center text-center text-[#73737A]">
                  <Search className="mb-3 h-8 w-8 text-[#B7B8BE]" />
                  <p className="text-[12px] font-medium">No icons found</p>
                  <p className="mt-1 text-[11px]">
                    Try a different search term.
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 pb-4 pt-2">
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReplaceIcons();
                }}
                style={{
                  background:
                    "linear-gradient(270deg, #D5CAFC 2.4%, #E3D2EB 27.88%, #F4DCD3 69.23%, #FDE4C2 100%)",
                }}
                disabled={!selectedIconUrl && !currentIconUrl}
                className="h-10 rounded-full  px-4 text-sm font-semibold text-[#101323] shadow-none hover:bg-[#F2DDAA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace Icons
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default IconsEditor;
