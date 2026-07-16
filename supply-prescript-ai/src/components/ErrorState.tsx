export function ErrorState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
      <h3 className="text-lg font-semibold text-rose-700">Unable to load data</h3>
      <p className="mt-2 text-sm text-rose-600">The dashboard could not retrieve the latest supply-chain records.</p>
    </div>
  )
}
