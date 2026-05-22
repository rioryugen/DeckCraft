// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

'use client';

import { useEffect } from 'react';
import { initMixpanel, MixpanelEvent, trackEvent } from '@/lib/mixpanel';
import { usePathname } from 'next/navigation';

export function MixpanelInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize once
  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    trackEvent(MixpanelEvent.PageView, { url: pathname });
  }, [pathname]);

  return <>{children}</>;
}

export default MixpanelInitializer;


