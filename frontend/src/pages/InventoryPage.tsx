import { useQuery } from '@tanstack/react-query'
import { PageHeader, DataTable, LoadingSpinner } from '../components'
import { getInventory } from '../lib/api'

export function InventoryPage() {
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory-page'],
    queryFn: () => getInventory({ limit: 20 }),
  })

  const tableRows = inventory.map((item) => ({
    id: item.id,
    name: item.item_name,
    category: item.category ?? '—',
    status: item.status,
    value: `${item.quantity} units`,
    region: item.region ?? '—',
  }))

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stay ahead of stockouts and optimize warehouse availability."
      />
      <DataTable rows={tableRows} title="Inventory positions" />
    </div>
  )
}
