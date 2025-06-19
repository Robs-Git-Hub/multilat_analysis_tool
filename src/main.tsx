
// File: src/main.tsx

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// 1. Create a new instance of the QueryClient.
// This object holds the cache and configuration for our data fetching.
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    {/* 2. Wrap the entire App component with the QueryClientProvider. */}
    {/* This makes the queryClient available to any component in the app, */}
    {/* including our useTernaryData hook. */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
);
