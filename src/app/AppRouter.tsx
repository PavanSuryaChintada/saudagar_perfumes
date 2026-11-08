import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import App from '../App.jsx';

// The admin is code-split: shoppers never download it.
const AdminApp = lazy(() => import('../admin/AdminApp'));
const CustomerInvoice = lazy(() => import('../storefront/orders/CustomerInvoice'));

export default function AppRouter() {
  return (
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
  );
}
