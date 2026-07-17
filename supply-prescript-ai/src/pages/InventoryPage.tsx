import { PageHeader, DataTable } from '../components'
import { inventory } from '../data/mockData'

export function InventoryPage() {
  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stay ahead of stockouts and optimize warehouse availability."
      />
      <DataTable rows={inventory.map((row) => ({ ...row, id: row.id, name: row.name, category: row.category, status: row.status, value: row.value, region: row.region }))} title="Inventory positions" />
    </div>
  )
}
