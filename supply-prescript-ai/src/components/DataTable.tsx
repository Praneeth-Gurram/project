import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material'
import type { TableRow as TableRowData } from '../types'

interface DataTableProps {
  rows: TableRowData[]
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
              <TableRow key={row.id} hover>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>
                  <Chip label={row.status} color={row.status === 'Delivered' || row.status === 'Healthy' ? 'success' : row.status === 'Delayed' || row.status === 'Watch' ? 'warning' : 'info'} size="small" />
                </TableCell>
                <TableCell>{row.value}</TableCell>
                <TableCell>{row.region}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
