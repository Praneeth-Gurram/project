import { Paper, Typography, Stack, FormControlLabel, Checkbox, Divider } from '@mui/material'

export function FilterPanel() {
  return (
    <Paper className="rounded-2xl border border-slate-200 p-4 shadow-sm">
      <Typography variant="subtitle1" className="font-semibold text-slate-900">
        Filters
      </Typography>
      <Divider className="my-3" />
      <Stack spacing={1}>
        <FormControlLabel control={<Checkbox defaultChecked />} label="On-time only" />
        <FormControlLabel control={<Checkbox defaultChecked />} label="High priority" />
        <FormControlLabel control={<Checkbox />} label="Delayed shipments" />
      </Stack>
    </Paper>
  )
}
