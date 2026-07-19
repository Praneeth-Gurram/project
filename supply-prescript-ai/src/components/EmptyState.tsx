export function EmptyState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
      <h3 className="text-lg font-semibold text-slate-800">No records available</h3>
      <p className="mt-2 text-sm text-slate-500">Try adjusting your filters or create a new record to get started.</p>
    </div>
  )
}
