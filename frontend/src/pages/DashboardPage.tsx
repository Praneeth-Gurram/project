import { Grid, Paper, Typography, Box } from '@mui/material'
import { TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DataTable, PageHeader, SearchBar, StatCard, FilterPanel, OperationalTrendChart, LoadingSpinner } from '../components'
import { getDashboardSummary, getOrders } from '../lib/api'
import type { StatCardData } from '../types'

export function DashboardPage() {
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => getDashboardSummary(),
  })

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders({ limit: 5 }),
  })

  const stats: StatCardData[] = dashboard?.stats ?? []
  const tableRows = orders.map((order) => ({
    id: order.id,
    name: order.name,
    category: order.category ?? '—',
    status: order.status,
    value: `$${Number(order.value).toLocaleString()}`,
    region: order.region ?? '—',
  }))

  if (isDashboardLoading || isOrdersLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Monitor supply chain performance, order health, and forecast accuracy from one workspace."
        action={<SearchBar />}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Typography variant="h6" className="font-semibold text-slate-900">
                  Operational trend
                </Typography>
                <Typography variant="body2" className="text-slate-500">
                  Forecasted demand vs. actual fulfillment
                </Typography>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                <TrendingUp size={16} />
                +8.2% QoQ
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-2">
              <OperationalTrendChart />
            </div>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <FilterPanel />
        </Grid>
      </Grid>

      <Box className="mt-6">
        <DataTable rows={tableRows} title="Recent orders" />
      </Box>
    </div>
  )
}
