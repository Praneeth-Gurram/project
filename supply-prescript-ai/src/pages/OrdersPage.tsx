import { PageHeader, DataTable } from '../components'
import { orders } from '../data/mockData'

export function OrdersPage() {
  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track high-value orders, fulfillment progress, and customer commitments."
      />
      <DataTable rows={orders.map((row) => ({ ...row, id: row.id, name: row.name, category: row.category, status: row.status, value: row.value, region: row.region }))} title="Order portfolio" />
    </div>
  )
}
