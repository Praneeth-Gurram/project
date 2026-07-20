import { PageHeader, DataTable } from '../components'
import { shipments } from '../data/mockData'

export function ShipmentsPage() {
  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Monitor transportation lanes, delays, and arrival timelines across regions."
      />
      <DataTable rows={shipments.map((row) => ({ ...row, id: row.id, name: row.name, category: row.category, status: row.status, value: row.value, region: row.region }))} title="Shipment network" />
    </div>
  )
}
