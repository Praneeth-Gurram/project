import { PageHeader, DataTable } from '../components'
import { suppliers } from '../data/mockData'

export function SuppliersPage() {
  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Review supplier performance, risk posture, and strategic spend."
      />
      <DataTable rows={suppliers.map((row) => ({ ...row, id: row.id, name: row.name, category: row.category, status: row.status, value: row.value, region: row.region }))} title="Supplier scorecard" />
    </div>
  )
}
