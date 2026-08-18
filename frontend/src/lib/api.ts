import axios from 'axios'
import type {
  ConfidenceResponse,
  DashboardSummaryResponse,
  FeatureImportanceResponse,
  InventoryItem,
  Order,
  PredictionExplanation,
  RecommendationResponse,
  Shipment,
  Supplier,
} from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail ?? error.message ?? 'Request failed'
    return Promise.reject(new Error(message))
  },
)

export interface ListParams {
  skip?: number
  limit?: number
  search?: string
  status?: string
  region?: string
  sort_by?: string
}

export interface DashboardOrdersSummary {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_value: string
}

export interface DashboardShipmentsSummary {
  total_shipments: number
  in_transit: number
  delivered: number
  delayed: number
}

export interface DashboardInventorySummary {
  total_items: number
  total_quantity: number
  low_stock_items: number
  available_items: number
}

export const getDashboardSummary = async (): Promise<DashboardSummaryResponse> => {
  const { data } = await api.get('/api/dashboard/summary')
  return data
}

export const getDashboardOrdersSummary = async (): Promise<DashboardOrdersSummary> => {
  const { data } = await api.get('/api/dashboard/orders-summary')
  return data
}

export const getDashboardShipmentsSummary = async (): Promise<DashboardShipmentsSummary> => {
  const { data } = await api.get('/api/dashboard/shipments-summary')
  return data
}

export const getDashboardInventorySummary = async (): Promise<DashboardInventorySummary> => {
  const { data } = await api.get('/api/dashboard/inventory-summary')
  return data
}

export const getOrders = async (params?: ListParams): Promise<Order[]> => {
  const { data } = await api.get('/api/orders', { params })
  return data
}

export const getOrder = async (id: number): Promise<Order> => {
  const { data } = await api.get(`/api/orders/${id}`)
  return data
}

export const createOrder = async (order: Omit<Order, 'id' | 'created_at'>): Promise<Order> => {
  const { data } = await api.post('/api/orders', order)
  return data
}

export const updateOrder = async (id: number, order: Partial<Omit<Order, 'id' | 'created_at'>>): Promise<Order> => {
  const { data } = await api.patch(`/api/orders/${id}`, order)
  return data
}

export const deleteOrder = async (id: number): Promise<void> => {
  await api.delete(`/api/orders/${id}`)
}

export const getShipments = async (params?: ListParams & { traffic_status?: string }): Promise<Shipment[]> => {
  const { data } = await api.get('/api/shipments', { params })
  return data
}

export const getShipment = async (id: number): Promise<Shipment> => {
  const { data } = await api.get(`/api/shipments/${id}`)
  return data
}

export const createShipment = async (shipment: Omit<Shipment, 'id' | 'created_at'>): Promise<Shipment> => {
  const { data } = await api.post('/api/shipments', shipment)
  return data
}

export const updateShipment = async (id: number, shipment: Partial<Omit<Shipment, 'id' | 'created_at'>>): Promise<Shipment> => {
  const { data } = await api.patch(`/api/shipments/${id}`, shipment)
  return data
}

export const deleteShipment = async (id: number): Promise<void> => {
  await api.delete(`/api/shipments/${id}`)
}

export const getSuppliers = async (params?: ListParams): Promise<Supplier[]> => {
  const { data } = await api.get('/api/suppliers', { params })
  return data
}

export const getSupplier = async (id: number): Promise<Supplier> => {
  const { data } = await api.get(`/api/suppliers/${id}`)
  return data
}

export const createSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> => {
  const { data } = await api.post('/api/suppliers', supplier)
  return data
}

export const updateSupplier = async (id: number, supplier: Partial<Omit<Supplier, 'id' | 'created_at'>>): Promise<Supplier> => {
  const { data } = await api.patch(`/api/suppliers/${id}`, supplier)
  return data
}

export const deleteSupplier = async (id: number): Promise<void> => {
  await api.delete(`/api/suppliers/${id}`)
}

export const getInventory = async (params?: ListParams & { low_stock?: boolean }): Promise<InventoryItem[]> => {
  const { data } = await api.get('/api/inventory', { params })
  return data
}

export const getInventoryItem = async (id: number): Promise<InventoryItem> => {
  const { data } = await api.get(`/api/inventory/${id}`)
  return data
}

export const createInventoryItem = async (item: Omit<InventoryItem, 'id' | 'created_at'>): Promise<InventoryItem> => {
  const { data } = await api.post('/api/inventory', item)
  return data
}

export const updateInventoryItem = async (id: number, item: Partial<Omit<InventoryItem, 'id' | 'created_at'>>): Promise<InventoryItem> => {
  const { data } = await api.patch(`/api/inventory/${id}`, item)
  return data
}

export const deleteInventoryItem = async (id: number): Promise<void> => {
  await api.delete(`/api/inventory/${id}`)
}

export const getPredictionExplanation = async (shipmentId: number): Promise<PredictionExplanation> => {
  const { data } = await api.get(`/prediction-explanation/${shipmentId}`)
  return data
}

export const getRecommendationExplanation = async (shipmentId: number): Promise<RecommendationResponse> => {
  const { data } = await api.get(`/recommendation-explanation/${shipmentId}`)
  return data
}

export const getConfidenceScores = async (shipmentId: number): Promise<ConfidenceResponse> => {
  const { data } = await api.get(`/confidence-score/${shipmentId}`)
  return data
}

export const getFeatureImportance = async (): Promise<FeatureImportanceResponse> => {
  const { data } = await api.get('/feature-importance')
  return data
}

export const healthCheck = async (): Promise<{ status: string; service: string; database: string }> => {
  const { data } = await api.get('/api/health')
  return data
}

