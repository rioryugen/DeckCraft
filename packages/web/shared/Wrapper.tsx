// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface WrapperProps {
    children: ReactNode;
    className?: string;
}

export default function Wrapper({ children, className }: WrapperProps) {
    return <div className={cn(`max-w-[1440px] w-full  mx-auto `, className)}>{children}</div>;
}
