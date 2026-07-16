import { Card, CardContent, Typography } from '@mui/material'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { StatCardData } from '../types'

interface StatCardProps {
  item: StatCardData
}

export function StatCard({ item }: StatCardProps) {
  const isPositive = item.trend === 'up'

  return (
    <Card className="rounded-2xl border border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between">
        <div>
          <Typography variant="body2" className="text-slate-500">
            {item.title}
          </Typography>
          <Typography variant="h5" className="mt-2 font-semibold text-slate-900">
            {item.value}
          </Typography>
          <div className={`mt-2 flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{item.change}</span>
          </div>
        </div>
        <div className="rounded-xl bg-slate-100 p-3 text-2xl">{item.icon}</div>
      </CardContent>
    </Card>
  )
}
