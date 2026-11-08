import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import App from '../App.jsx';
import ErrorBoundary from '../components/ErrorBoundary';

// The admin is code-split: shoppers never download it.
const AdminApp = lazy(() => import('../admin/AdminApp'));
const CustomerInvoice = lazy(() => import('../storefront/orders/CustomerInvoice'));

export default function AppRouter() {
  // A page that breaks shows a calm message instead of a blank screen; moving to another page tries again.
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route
          path="/orders/:id/invoice"
          element={
            <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
              <CustomerInvoice />
            </Suspense>
          }
        />
        <Route path="*" element={<App />} />
      </Routes>
    </ErrorBoundary>
  );
}
