'use client'

interface ForecastBarProps {
  retirementCliff: number | null   // % over 55
  pipelineRatio: number | null     // graduates per 100 physicians
  shortfall10yr: number | null     // % shortfall
}

export function ForecastBar({ retirementCliff, pipelineRatio, shortfall10yr }: ForecastBarProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">Retirement Cliff (% over 55)</span>
          <span className="text-[10px] font-mono text-zinc-300">
            {retirementCliff !== null ? `${retirementCliff}%` : 'N/A'}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(retirementCliff ?? 0, 100)}%`,
              background: (retirementCliff ?? 0) > 40
                ? '#ef4444'
                : (retirementCliff ?? 0) > 30
                ? '#f97316'
                : '#eab308',
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">Pipeline Ratio (grads / 100 physicians)</span>
          <span className="text-[10px] font-mono text-zinc-300">
            {pipelineRatio !== null ? pipelineRatio.toFixed(1) : 'N/A'}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((pipelineRatio ?? 0) * 7, 100)}%`,
              background: (pipelineRatio ?? 0) > 8
                ? '#00d4aa'
                : (pipelineRatio ?? 0) > 5
                ? '#eab308'
                : '#ef4444',
            }}
          />
        </div>
      </div>

      {shortfall10yr !== null && (
        <div className="mt-2 p-2.5 bg-zinc-900 border border-white/5 rounded-sm">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">10-Year Projected Shortfall</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className="text-xl font-serif"
              style={{ color: shortfall10yr > 0 ? '#ef4444' : '#00d4aa' }}
            >
              {shortfall10yr > 0 ? `−${shortfall10yr}` : `+${Math.abs(shortfall10yr)}`}%
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {shortfall10yr > 0 ? 'workforce loss' : 'workforce gain'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
