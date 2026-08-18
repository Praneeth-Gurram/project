import { useQuery } from '@tanstack/react-query'
import { PageHeader, DataTable, LoadingSpinner } from '../components'
import { getOrders } from '../lib/api'

export function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-page'],
    queryFn: () => getOrders({ limit: 20 }),
  })

  const tableRows = orders.map((order) => ({
    id: order.id,
    name: order.name,
    category: order.category ?? '—',
    status: order.status,
    value: `$${Number(order.value).toLocaleString()}`,
    region: order.region ?? '—',
  }))

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track high-value orders, fulfillment progress, and customer commitments."
      />
      <DataTable rows={tableRows} title="Order portfolio" />
    </div>
  )
}
