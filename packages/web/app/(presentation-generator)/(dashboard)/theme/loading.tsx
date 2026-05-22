// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { Skeleton } from '@/shared/ui/skeleton'

const ThemeCardSkeleton = () => (
    <div className="rounded-xl px-6 border border-[#EDEEEF] w-[305px] bg-white overflow-hidden">
        {/* Preview area */}
        <div className="relative h-[250px] p-6">
            {/* Top badges */}
            <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            {/* Card preview */}
            <div className="h-full flex items-center justify-center">
                <div className="w-full h-[135px] rounded-xl overflow-hidden">
                    <Skeleton className="w-full h-full" />
                </div>
            </div>
        </div>
        {/* Bottom info */}
        <div className="px-5 border-t border-[#EDEEEF] py-2.5 h-[80px] flex items-center justify-between">
            <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <div className="flex items-center gap-1">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="w-4 h-4 rounded-full" />
                </div>
            </div>
            <Skeleton className="h-5 w-5" />
        </div>
    </div>
)

const Loading = () => {
    return (
        <div className="space-y-6">
            {/* Tabs skeleton */}
            <div className="p-1 rounded-[40px] bg-[#F7F6F9] w-fit border border-[#F4F4F4] flex items-center justify-center">
                <Skeleton className="h-8 w-20 rounded-[70px]" />
                <div className="mx-1 w-[2px] h-[17px] bg-[#EDECEC]" />
                <Skeleton className="h-8 w-20 rounded-[70px]" />
            </div>

            {/* Theme cards grid */}
            <div className="flex flex-wrap gap-6">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <ThemeCardSkeleton key={idx} />
                ))}
            </div>
        </div>
    )
}

export default Loading

