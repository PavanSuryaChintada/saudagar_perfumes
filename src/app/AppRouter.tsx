import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import App from '../App.jsx';

// The admin is code-split: shoppers never download it.
const AdminApp = lazy(() => import('../admin/AdminApp'));

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
      <Route path="*" element={<App />} />
    </Routes>
  );
}
