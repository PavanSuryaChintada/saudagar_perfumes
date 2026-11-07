import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SmoothScrollProvider } from './components/motion/SmoothScrollProvider.jsx';
import { AuthProvider } from './lib/auth';
import AppRouter from './app/AppRouter';
import ThemeRuntime from './cms/ThemeRuntime';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeRuntime />
          <SmoothScrollProvider>
            <AppRouter />
          </SmoothScrollProvider>
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
