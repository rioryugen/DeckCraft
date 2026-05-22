// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import React, { useState, useEffect, useMemo } from "react";

import { DashboardApi } from "@/app/(presentation-generator)/services/api/dashboard";
import { PresentationGrid } from "@/app/(presentation-generator)/(dashboard)/dashboard/components/PresentationGrid";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { trackEvent, MixpanelEvent } from "@/lib/mixpanel";
import { usePathname } from "next/navigation";

const actionCardBase =
  "absolute aspect-[16/9] h-[46.238px] w-[82.201px] rounded-[4.474px] border border-white/50 bg-cover bg-center bg-no-repeat shadow-[0_8px_18px_rgba(16,24,40,0.18)] transition-all duration-500 ease-out translate-y-12 scale-95 opacity-0 group-hover/action:translate-y-0 group-hover/action:scale-100 group-hover/action:opacity-100 group-focus-visible/action:translate-y-0 group-focus-visible/action:scale-100 group-focus-visible/action:opacity-100";

const FloatingActionCards = () => (
  <div className="pointer-events-none absolute right-[14px] top-[-36px] z-0 block h-[64px] w-[158px]">
    <div
      className={`${actionCardBase} left-0 top-0  delay-75 border-none`}
      style={{
        backgroundImage: "url('/create_presentation_card_3.png')",
      }}
    />
    <div
      className={`${actionCardBase} left-[39px] top-1 z-10  delay-150 border-none`}
      style={{
        backgroundImage: "url('/create_presentation_card_2.png')",
      }}
    />
    <div
      className={`${actionCardBase} left-[76px] top-0  delay-200 border-none`}
      style={{
        backgroundImage: "url('/create_presentation_card_1.png')",
      }}
    />
  </div>
);

const DashboardPage: React.FC = () => {
  const pathname = usePathname();
  const [presentations, setPresentations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckSortDirection, setDeckSortDirection] = useState<"desc" | "asc">(
    "desc"
  );

  const sortedPresentations = useMemo(() => {
    if (!presentations) return presentations;

    return [...presentations].sort((a: any, b: any) => {
      const first = new Date(a.updated_at ?? a.created_at).getTime();
      const second = new Date(b.updated_at ?? b.created_at).getTime();

      return deckSortDirection === "desc" ? second - first : first - second;
    });
  }, [presentations, deckSortDirection]);

  useEffect(() => {
    const loadData = async () => {
      await fetchPresentations();
    };
    loadData();
  }, []);

  const fetchPresentations = async () => {
    let fetchedCount = 0;
    let hasError = false;
    try {
      setIsLoading(true);
      setError(null);
      const data = await DashboardApi.getPresentations();
      fetchedCount = data.length;
      data.sort(
        (a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setPresentations(data);
    } catch (err) {
      hasError = true;
      setError(null);
      setPresentations([]);
    } finally {
      trackEvent(MixpanelEvent.Dashboard_Page_Viewed, {
        pathname,
        presentation_count: fetchedCount,
        load_failed: hasError,
      });
      setIsLoading(false);
    }
  };

  const removePresentation = (presentationId: string) => {
    setPresentations((prev: any) =>
      prev ? prev.filter((p: any) => p.id !== presentationId) : []
    );
  };

  return (
    <div className="min-h-screen w-full px-3 pb-10 sm:px-6 relative">
      <div className="sticky top-0 right-0 z-50 py-[28px] backdrop-blur mb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[28px] tracking-[-0.84px] font-syne font-normal text-[#101828] flex items-center gap-2">
            Slide Presentation
          </h3>
        </div>
      </div>
      <section className="relative z-10 overflow-visible  ">
        <h2 className="font-syne text-base bg-transparent font-medium pb-3.5  text-[#333333] ">
          Actions
        </h2>
        <Link
          href="/upload"
          onClick={() =>
            trackEvent(MixpanelEvent.Dashboard_New_Presentation_Clicked, {
              pathname,
              source: "dashboard_actions_card",
            })
          }
          className="group/action bg-white z-50 mt-2  relative  block w-[304px] max-w-full overflow-visible rounded-[10.8px] outline-none focus-visible:ring-2 focus-visible:ring-[#7A5AF8] focus-visible:ring-offset-4 cursor-pointer"
          aria-label="Create presentation"
        >
          <FloatingActionCards />

          <img
            src="/create_presentation_bg.png"
            alt="Background of the create presentation card"
            className="relative bg-white z-10 h-[89.983px] w-[304px] max-w-full rounded-[10.8px] object-cover"
          />
          <span className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center font-syne text-sm font-medium text-[#191919]">
            Create Presentation
          </span>
        </Link>
      </section>
      <section className="relative z-10 mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-syne text-base font-medium  text-[#333333] ">
            Decks
          </h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#2F3033] transition-colors hover:bg-[#F3F3F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A5AF8]"
            title="Toggle deck sort order"
            aria-label="Toggle deck sort order"
            onClick={() =>
              setDeckSortDirection((current) =>
                current === "desc" ? "asc" : "desc"
              )
            }
          >
            <ArrowUpDown
              className={`h-4 w-4 transition-transform duration-300 ${
                deckSortDirection === "asc" ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        <PresentationGrid
          presentations={sortedPresentations}
          isLoading={isLoading}
          error={error}
          onPresentationDeleted={removePresentation}
        />
      </section>
      <div
        className="fixed z-0 bottom-[-16.5rem] left-0 w-full h-full"
        style={{
          height: "341px",
          borderRadius: "1440px",
          background:
            "radial-gradient(5.92% 104.69% at 50% 100%, rgba(122, 90, 248, 0.00) 0%, rgba(255, 255, 255, 0.00) 100%), radial-gradient(50% 50% at 50% 50%, rgba(122, 90, 248, 0.80) 0%, rgba(122, 90, 248, 0.00) 100%)",
        }}
      />
    </div>
  );
};

export default DashboardPage;
