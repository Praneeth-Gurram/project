export interface StatCardData {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
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
