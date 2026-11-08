import { Route, Routes } from 'react-router';
import RequireAdmin from './RequireAdmin';
import AdminLayout from './AdminLayout';
import LoginPage from '../storefront/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import ProductsPage from './pages/catalog/ProductsPage';
import ProductEditorPage from './pages/catalog/ProductEditorPage';
import CategoriesPage from './pages/catalog/CategoriesPage';
import CollectionsPage from './pages/catalog/CollectionsPage';
import NotesPage from './pages/catalog/NotesPage';
import ScentProfilePage from './pages/catalog/ScentProfilePage';
import PagesPage from './pages/cms/PagesPage';
import PageEditorPage from './pages/cms/PageEditorPage';
import SiteContentPage from './pages/cms/SiteContentPage';
import ContentListPage from './pages/cms/ContentListPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import PrintOrderPage from './pages/orders/PrintOrderPage';
import InventoryPage from './pages/orders/InventoryPage';
import SamplesPage from './pages/orders/SamplesPage';
import CouponsPage from './pages/coupons/CouponsPage';
import ShippingSettingsPage from './pages/ShippingSettingsPage';
import ReturnsPage from './pages/orders/ReturnsPage';
import RefundsPage from './pages/orders/RefundsPage';
import ReviewsPage from './pages/catalog/ReviewsPage';
import BackInStockPage from './pages/catalog/BackInStockPage';
import CustomersPage from './pages/CustomersPage';
import ExportPage from './pages/ExportPage';
import GuidePage from './guide/GuidePage';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage admin />} />
      <Route
        path="orders/:id/print"
        element={
          <RequireAdmin>
            <PrintOrderPage />
          </RequireAdmin>
        }
      />
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="media" element={<MediaLibraryPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductEditorPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="scent-profile" element={<ScentProfilePage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="pages/:id" element={<PageEditorPage />} />
        <Route path="site" element={<SiteContentPage />} />
        <Route path="content/:kind" element={<ContentListPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="samples" element={<SamplesPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="shipping" element={<ShippingSettingsPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="back-in-stock" element={<BackInStockPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="export" element={<ExportPage />} />
        <Route
          path="*"
          element={<p className="text-[13px] text-[#777777]">This admin page doesn't exist yet.</p>}
        />
      </Route>
    </Routes>
  );
}
