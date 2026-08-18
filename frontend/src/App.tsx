import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage, OrdersPage, ShipmentsPage, SuppliersPage, InventoryPage, SettingsPage } from './pages'
import XAIDashboard from './pages/XAIDashboard'
import './index.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/xai" element={<XAIDashboard />} />
    </Routes>
  )
}

export default App
