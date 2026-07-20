import { TextField, InputAdornment } from '@mui/material'
import { Search } from 'lucide-react'

export function SearchBar() {
  return (
    <TextField
      placeholder="Search records"
      size="small"
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} className="text-slate-400" />
            </InputAdornment>
          ),
        },
      }}
      className="max-w-md"
    />
  )
}
