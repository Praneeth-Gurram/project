import { PageHeader } from '../components'

export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure workspace preferences, alert rules, and data sources."
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Workspace configuration</h3>
        <p className="mt-2 text-sm text-slate-500">This section is ready for future integrations with alerts, role-based access, and data connectors.</p>
      </div>
    </div>
  )
}
