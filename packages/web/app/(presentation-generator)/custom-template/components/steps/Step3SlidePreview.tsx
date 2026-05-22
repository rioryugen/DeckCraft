// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

/**
 * Step 3: Slide Preview
 * Displays preview of slides with uploaded fonts
 */

import React from "react";
import { SlidePreviewSection } from "../SlidePreviewSection";
import { FontUploadPreviewResponse } from "../../types";

interface Step3SlidePreviewProps {
    previewData: FontUploadPreviewResponse | null;
    onInitTemplate: () => void;
    isLoading: boolean;
}

export const Step3SlidePreview: React.FC<Step3SlidePreviewProps> = ({
    previewData,
    onInitTemplate,
    isLoading,
}) => {
    if (!previewData) return null;

    return (
        <SlidePreviewSection
            previewData={previewData}
            onInitTemplate={onInitTemplate}
            isLoading={isLoading}
        />
    );
};

