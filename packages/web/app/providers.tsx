// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>
      {children}
  </Provider>;
}
