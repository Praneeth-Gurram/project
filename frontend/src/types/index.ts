export type TrendDirection = 'up' | 'down'

export interface StatCardData {
  title: string
  value: string
  change: string
  trend: TrendDirection
  icon: string
}

export interface TableRow {
  id: number
  name: string
  category: string
  status: string
  value: string
  region: string
}

export interface PageHeaderProps {
  title: string
  description: string
  action?: React.ReactNode
}

export interface Order {
  id: number
  order_number: string
  name: string
  category?: string | null
  status: string
  value: number
  region?: string | null
  created_at: string
}

export interface Shipment {
  id: number
  shipment_number: string
  name: string
  status: string
  region?: string | null
  category?: string | null
  traffic_status?: string | null
  value: number
  waiting_time: number
  created_at: string
}

export interface Supplier {
  id: number
  name: string
  category?: string | null
  status: string
  region?: string | null
  risk_score: number
  created_at: string
}

export interface InventoryItem {
  id: number
  item_name: string
  category?: string | null
  status: string
  quantity: number
  region?: string | null
  reorder_level: number
  created_at: string
}

export interface DashboardSummaryResponse {
  stats: StatCardData[]
  summary: {
    total_records: number
    avg_waiting_time: number
    avg_inventory_level: number
    regions: string[]
  }
}

export interface PredictionFeatureImpact {
  feature: string
  business_name: string
  contribution: number
  impact: number
  value: number
}

export interface PredictionExplanation {
  shipment_id: number
  predicted_delay_mins: number
  delay_probability: string
  confidence_score: string
  risk_level: 'Low' | 'Medium' | 'High'
  business_explanation: string
  top_features: PredictionFeatureImpact[]
  base_value: number
}

export interface RecommendationResponse {
  Recommendation?: string
  Reason?: string
  ExpectedDelayReduction?: string
  ExpectedSavings?: string
  ExpectedROI?: string
  Confidence?: string
  status?: string
}

export interface ConfidenceResponse {
  PredictionConfidence: number
  RecommendationConfidence: number
  OptimizationConfidence: number
  ModelConfidence: number
}

export interface FeatureImportanceResponse {
  global_importance: Array<{
    feature: string
    business_name: string
    impact: number
  }>
}

export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  pages: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

export interface ApiError {
  message: string
  status?: number
  detail?: string
}
