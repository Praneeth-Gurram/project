import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, Divider, Button } from '@mui/material'
import { LayoutDashboard, Package, Truck, Factory, Boxes, Settings, Menu, ChevronRight } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Orders', to: '/orders', icon: Package },
  { label: 'Shipments', to: '/shipments', icon: Truck },
  { label: 'Suppliers', to: '/suppliers', icon: Factory },
  { label: 'Inventory', to: '/inventory', icon: Boxes },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <AppBar position="sticky" color="transparent" elevation={0} className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <Toolbar className="flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <IconButton className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu />
            </IconButton>
            <Link to="/" className="text-lg font-semibold text-slate-900">
              SupplyPrescript AI
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlined" size="small">Live view</Button>
            <Button variant="contained" size="small">Sync data</Button>
          </div>
        </Toolbar>
      </AppBar>

      <div className="flex">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          classes={{ paper: 'w-72' }}
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </Drawer>

        <Box className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/80 lg:block">
          <SidebarContent />
        </Box>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
          <footer className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">
            SupplyPrescript AI • Week 1 frontend scaffold • Mock data only
          </footer>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <Typography variant="h6" className="font-semibold text-slate-900">
          Supply Chain Hub
        </Typography>
        <Typography variant="body2" className="mt-1 text-slate-500">
          Enterprise analytics workspace
        </Typography>
      </div>
      <Divider />
      <List>
        {navItems.map(({ label, to, icon: Icon }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            onClick={onNavigate}
            className="mx-2 my-1 rounded-xl"
          >
            <ListItemIcon>
              <Icon size={18} />
            </ListItemIcon>
            <ListItemText primary={label} />
            <ChevronRight size={16} className="text-slate-400" />
          </ListItemButton>
        ))}
      </List>
      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Typography variant="subtitle2" className="font-semibold text-slate-900">
            Week 1 status
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            UI scaffold complete with responsive layout and mock data.
          </Typography>
        </div>
      </div>
    </div>
  )
}
