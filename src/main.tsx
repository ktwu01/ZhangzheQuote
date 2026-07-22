import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { QuoteReader } from './components/QuoteReader';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuoteReader />
  </StrictMode>,
);
