'use client'

interface MetricCardProps {
  label: string
  value: string | number | null
  unit?: string
  sub?: string
  accent?: string
}

export function MetricCard({ label, value, unit, sub, accent = '#00d4aa' }: MetricCardProps) {
  return (
    <div className="bg-zinc-900/60 border border-white/5 p-4 flex flex-col gap-1">
      <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-serif" style={{ color: value !== null ? accent : '#52525b' }}>
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {unit && value !== null && (
          <span className="text-xs font-mono text-zinc-500">{unit}</span>
        )}
      </div>
      {sub && <span className="text-[10px] font-mono text-zinc-600">{sub}</span>}
    </div>
  )
}
