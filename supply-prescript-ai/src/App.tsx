import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage, OrdersPage, ShipmentsPage, SuppliersPage, InventoryPage, SettingsPage } from './pages'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
