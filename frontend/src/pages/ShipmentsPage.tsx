import { useQuery } from '@tanstack/react-query'
import { PageHeader, DataTable, LoadingSpinner } from '../components'
import { getShipments } from '../lib/api'

export function ShipmentsPage() {
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments-page'],
    queryFn: () => getShipments({ limit: 20 }),
  })

  const tableRows = shipments.map((shipment) => ({
    id: shipment.id,
    name: shipment.name,
    category: shipment.category ?? '—',
    status: shipment.status,
    value: `$${Number(shipment.value).toLocaleString()}`,
    region: shipment.region ?? '—',
  }))

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Monitor transportation lanes, delays, and arrival timelines across regions."
      />
      <DataTable rows={tableRows} title="Shipment network" />
    </div>
  )
}
