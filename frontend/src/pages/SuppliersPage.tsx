import { useQuery } from '@tanstack/react-query'
import { PageHeader, DataTable, LoadingSpinner } from '../components'
import { getSuppliers } from '../lib/api'

export function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers-page'],
    queryFn: () => getSuppliers({ limit: 20 }),
  })

  const tableRows = suppliers.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    category: supplier.category ?? '—',
    status: supplier.status,
    value: `${Number(supplier.risk_score).toFixed(2)}`,
    region: supplier.region ?? '—',
  }))

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Review supplier performance, risk posture, and strategic spend."
      />
      <DataTable rows={tableRows} title="Supplier scorecard" />
    </div>
  )
}
