import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material'

interface DataTableRow {
  id: number | string
  name: string
  category?: string | number | null
  status?: string | number | null
  value?: string | number | null
  region?: string | number | null
  [key: string]: unknown
}

interface DataTableProps {
  rows: DataTableRow[]
  title: string
}

export function DataTable({ rows, title }: DataTableProps) {
  return (
    <Paper className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Region</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={String(row.id)} hover>
                <TableCell>{String(row.name ?? '—')}</TableCell>
                <TableCell>{String(row.category ?? '—')}</TableCell>
                <TableCell>
                  <Chip
                    label={String(row.status ?? '—')}
                    color={String(row.status ?? '').includes('Delivered') || String(row.status ?? '').includes('Healthy') ? 'success' : String(row.status ?? '').includes('Delayed') || String(row.status ?? '').includes('Watch') ? 'warning' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{String(row.value ?? '—')}</TableCell>
                <TableCell>{String(row.region ?? '—')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
