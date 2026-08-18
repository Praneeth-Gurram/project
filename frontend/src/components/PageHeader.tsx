import { Button, Typography } from '@mui/material'
import type { PageHeaderProps } from '../types'

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <Typography variant="h5" className="font-semibold text-slate-900">
          {title}
        </Typography>
        <Typography variant="body2" className="mt-1 text-slate-500">
          {description}
        </Typography>
      </div>
      {action ? <div>{action}</div> : <Button variant="contained">Export</Button>}
    </div>
  )
}
