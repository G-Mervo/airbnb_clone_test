import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Main/HomePage';
import LoginPage from './components/Main/LoginPage';
import Profile from './components/Main/Profile';
import Wishlist from './components/Main/Wishlist';
import Trips from './components/Main/Trips';
import SearchResults from './components/Main/SearchResults';
import HouseDetail from './components/House-detail/HouseDetail';
import CheckoutPage from './components/Booking/CheckoutPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from './components/ErrorBoundary';
import { appConfig } from './config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: appConfig.cacheDurationMs,
      gcTime: appConfig.cacheDurationMs * 2,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/account-settings', element: <Profile defaultTab="about" /> },
  { path: '/wishlist', element: <Wishlist /> },
  { path: '/trips', element: <Trips /> },
  { path: '/search', element: <SearchResults /> },
  { path: '/house/:id', element: <HouseDetail /> },
  { path: '/:id/book', element: <CheckoutPage /> },
  { path: '*', element: <Home /> },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Analytics />
        {appConfig.development.enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
