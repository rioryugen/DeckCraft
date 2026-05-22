// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LLMConfig } from '@/types/llm_config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';

export type VertexAzureManualPatch = Partial<
  Pick<
    LLMConfig,
    | 'VERTEX_MODEL'
    | 'VERTEX_BASE_URL'
    | 'VERTEX_PROJECT'
    | 'VERTEX_LOCATION'
    | 'AZURE_OPENAI_MODEL'
    | 'AZURE_OPENAI_ENDPOINT'
    | 'AZURE_OPENAI_BASE_URL'
    | 'AZURE_OPENAI_API_VERSION'
    | 'AZURE_OPENAI_DEPLOYMENT'
  >
>;

type Provider = 'vertex' | 'azure';

interface VertexAzureManualFieldsProps {
  provider: Provider;
  llmConfig: LLMConfig;
  onPatch: (patch: VertexAzureManualPatch) => void;
}

function hasVertexAdvancedContent(config: LLMConfig): boolean {
  return (
    !!(config.VERTEX_PROJECT || '').trim() ||
    !!(config.VERTEX_LOCATION || '').trim() ||
    !!(config.VERTEX_BASE_URL || '').trim()
  );
}

function hasValue(value?: string): boolean {
  return !!(value || '').trim();
}

export default function VertexAzureManualFields({
  provider,
  llmConfig,
  onPatch,
}: VertexAzureManualFieldsProps) {
  const [vertexAdvancedOpen, setVertexAdvancedOpen] = useState(() =>
    hasVertexAdvancedContent(llmConfig),
  );

  useEffect(() => {
    if (hasVertexAdvancedContent(llmConfig)) setVertexAdvancedOpen(true);
  }, [llmConfig.VERTEX_PROJECT, llmConfig.VERTEX_LOCATION, llmConfig.VERTEX_BASE_URL]);

  useEffect(() => {
    if (provider !== 'azure') return;

    const patch: VertexAzureManualPatch = {};
    if (
      hasValue(llmConfig.AZURE_OPENAI_DEPLOYMENT) &&
      !hasValue(llmConfig.AZURE_OPENAI_MODEL)
    ) {
      patch.AZURE_OPENAI_MODEL = llmConfig.AZURE_OPENAI_DEPLOYMENT;
    }
    if (hasValue(llmConfig.AZURE_OPENAI_BASE_URL)) {
      patch.AZURE_OPENAI_BASE_URL = '';
    }
    if (hasValue(llmConfig.AZURE_OPENAI_DEPLOYMENT)) {
      patch.AZURE_OPENAI_DEPLOYMENT = '';
    }

    if (Object.keys(patch).length > 0) {
      onPatch(patch);
    }
  }, [
    provider,
    llmConfig.AZURE_OPENAI_BASE_URL,
    llmConfig.AZURE_OPENAI_DEPLOYMENT,
    llmConfig.AZURE_OPENAI_MODEL,
    onPatch,
  ]);

  const inputClass =
    'w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className="mt-3 w-full min-w-0 max-w-full space-y-4">
      {provider === 'vertex' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <input
              type="text"
              value={llmConfig.VERTEX_MODEL || ''}
              onChange={(e) => onPatch({ VERTEX_MODEL: e.target.value })}
              className={inputClass}
              placeholder="e.g. gemini-2.5-flash"
            />
          </div>

          <Collapsible open={vertexAdvancedOpen} onOpenChange={setVertexAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-[#F9F9FA] px-3 py-2.5 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
              >
                <span>Advanced settings</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-gray-600 transition-transform duration-200',
                    vertexAdvancedOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 overflow-hidden">
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Project ID</label>
                  <input
                    type="text"
                    value={llmConfig.VERTEX_PROJECT || ''}
                    onChange={(e) => onPatch({ VERTEX_PROJECT: e.target.value })}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Region</label>
                  <input
                    type="text"
                    value={llmConfig.VERTEX_LOCATION || ''}
                    onChange={(e) => onPatch({ VERTEX_LOCATION: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. us-central1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Custom endpoint</label>
                  <input
                    type="text"
                    value={llmConfig.VERTEX_BASE_URL || ''}
                    onChange={(e) => onPatch({ VERTEX_BASE_URL: e.target.value })}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      {provider === 'azure' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Azure endpoint</label>
            <input
              type="text"
              value={llmConfig.AZURE_OPENAI_ENDPOINT || ''}
              onChange={(e) => onPatch({ AZURE_OPENAI_ENDPOINT: e.target.value })}
              className={inputClass}
              placeholder="https://your-resource.openai.azure.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Model name</label>
            <input
              type="text"
              value={llmConfig.AZURE_OPENAI_MODEL || ''}
              onChange={(e) => onPatch({ AZURE_OPENAI_MODEL: e.target.value })}
              className={inputClass}
              placeholder="e.g. gpt-5.4-mini"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">API version</label>
            <input
              type="text"
              value={llmConfig.AZURE_OPENAI_API_VERSION || ''}
              onChange={(e) => onPatch({ AZURE_OPENAI_API_VERSION: e.target.value })}
              className={inputClass}
              placeholder="e.g. 2024-12-01-preview"
            />
          </div>
        </>
      )}
    </div>
  );
}
