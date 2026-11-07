import { Route, Routes } from 'react-router';
import RequireAdmin from './RequireAdmin';
import AdminLayout from './AdminLayout';
import LoginPage from '../storefront/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import MediaLibraryPage from './pages/MediaLibraryPage';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage admin />} />
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="media" element={<MediaLibraryPage />} />
        <Route
          path="*"
          element={<p className="text-[13px] text-[#777777]">This admin page doesn't exist yet.</p>}
        />
      </Route>
    </Routes>
  );
}
