'use client'

type Risk = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN'

const CONFIG: Record<Risk, { label: string; bg: string; text: string; dot: string }> = {
  CRITICAL: { label: 'CRITICAL', bg: 'bg-red-950/60',    text: 'text-red-400',    dot: 'bg-red-500' },
  HIGH:     { label: 'HIGH',     bg: 'bg-orange-950/60', text: 'text-orange-400', dot: 'bg-orange-500' },
  MODERATE: { label: 'MODERATE', bg: 'bg-yellow-950/60', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  LOW:      { label: 'LOW',      bg: 'bg-emerald-950/60',text: 'text-emerald-400',dot: 'bg-emerald-500' },
  UNKNOWN:  { label: 'N/A',      bg: 'bg-zinc-900',      text: 'text-zinc-500',   dot: 'bg-zinc-600' },
}

export function StatusBadge({ risk }: { risk: Risk }) {
  const c = CONFIG[risk]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono tracking-widest ${c.bg} ${c.text} border border-white/5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
