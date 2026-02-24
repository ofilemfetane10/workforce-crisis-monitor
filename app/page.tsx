'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, LineChart, Line, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import { StatusBadge } from '@/components/StatusBadge'
import { MetricCard } from '@/components/MetricCard'
import { ForecastBar } from '@/components/ForecastBar'
import { COUNTRIES, REGION_COLORS } from '@/lib/countries'
import type { CountryWorkforceScored } from '@/lib/eurostat'

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = 'totalPhysicians' | 'retirementCliffScore' | 'pipelineRatio' | 'shortageRisk'
type View = 'table' | 'chart' | 'detail'

const RISK_ORDER = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3, UNKNOWN: 4 }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number | null, dp = 1) {
  return v !== null && v !== undefined ? v.toFixed(dp) : '—'
}

function RiskDot({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    CRITICAL: '#ef4444', HIGH: '#f97316', MODERATE: '#eab308', LOW: '#10b981', UNKNOWN: '#52525b',
  }
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-2"
      style={{ background: colors[risk] ?? '#52525b' }}
    />
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 p-3 text-xs font-mono">
      <div className="text-zinc-400 mb-1.5 tracking-wider">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-zinc-200">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState<CountryWorkforceScored[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

  const [selected, setSelected] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('shortageRisk')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [view, setView] = useState<View>('table')
  const [filterRisk, setFilterRisk] = useState<string>('ALL')
  const [syncing, setSyncing] = useState(false)

  // Fetch data
  useEffect(() => {
    fetch('/api/workforce')
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setData(json.data)
        setSource(json.source)
        setSyncedAt(json.syncedAt)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Manual sync trigger
  async function triggerSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync/workforce', { method: 'GET' })
      const json = await res.json()
      if (json.success) {
        // Refetch
        const d = await fetch('/api/workforce').then(r => r.json())
        setData(d.data)
        setSource(d.source)
        setSyncedAt(d.syncedAt)
      }
    } finally {
      setSyncing(false)
    }
  }

  // Sorted + filtered data
  const sorted = useMemo(() => {
    let rows = [...data]
    if (filterRisk !== 'ALL') rows = rows.filter(r => r.shortageRisk === filterRisk)
    rows.sort((a, b) => {
      if (sortKey === 'shortageRisk') {
        return sortDir * (RISK_ORDER[a.shortageRisk] - RISK_ORDER[b.shortageRisk])
      }
      const av = a[sortKey] ?? -Infinity
      const bv = b[sortKey] ?? -Infinity
      return sortDir * ((av as number) - (bv as number))
    })
    return rows
  }, [data, sortKey, sortDir, filterRisk])

  const selectedCountry = data.find(d => d.code === selected)

  // Summary stats
  const criticalCount = data.filter(d => d.shortageRisk === 'CRITICAL').length
  const highCount = data.filter(d => d.shortageRisk === 'HIGH').length
  const avgCliff = data.filter(d => d.retirementCliffScore !== null)
  const avgCliffScore = avgCliff.length
    ? Math.round(avgCliff.reduce((s, d) => s + d.retirementCliffScore!, 0) / avgCliff.length)
    : null

  // Chart data
  const cliffChartData = [...data]
    .filter(d => d.retirementCliffScore !== null)
    .sort((a, b) => b.retirementCliffScore! - a.retirementCliffScore!)
    .slice(0, 20)
    .map(d => ({
      name: d.code,
      cliff: d.retirementCliffScore,
      pipeline: d.pipelineRatio,
      risk: d.shortageRisk,
    }))

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
  }

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k
    return (
      <th
        className="text-left text-[9px] font-mono tracking-widest text-zinc-500 uppercase pb-2 cursor-pointer hover:text-zinc-300 select-none"
        onClick={() => handleSort(k)}
      >
        {label}
        {active && <span className="ml-1 text-zinc-400">{sortDir === 1 ? '↑' : '↓'}</span>}
      </th>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-[10px] font-mono tracking-[0.3em] text-emerald-400 animate-pulse-slow uppercase">
            Fetching Eurostat workforce data...
          </div>
          <div className="flex gap-1 justify-center">
            {[0,1,2,3,4].map(i => (
              <div
                key={i}
                className="w-1 bg-zinc-700 rounded-full"
                style={{
                  height: `${16 + i * 8}px`,
                  animation: `pulse ${0.8 + i * 0.15}s ease infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="text-red-400 font-mono text-sm">Failed to load data</div>
          <div className="text-zinc-600 font-mono text-xs">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="noise min-h-screen relative">
      <div className="relative z-10">

        {/* ── Header ────────────────────────────────────────────── */}
        <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-[9px] font-mono tracking-[0.25em] text-emerald-400 uppercase mb-1">
                LIVE · Eurostat API · EU/EEA Healthcare
              </div>
              <h1 className="font-serif text-xl font-light tracking-tight text-zinc-100">
                European Physician Workforce Crisis Monitor
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Data source</div>
                <div className="text-[10px] font-mono text-zinc-400">
                  {source === 'database' ? '🗄 Supabase cache' : source === 'curated' ? ' Eurostat 2023' : ' Live Eurostat'}
                </div>
                {syncedAt && (
                  <div className="text-[9px] font-mono text-zinc-600">
                    {new Date(syncedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="text-[9px] font-mono tracking-widest uppercase px-3 py-1.5 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-colors disabled:opacity-40"
              >
                {syncing ? 'Syncing...' : '↻ Refresh'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

          {/* ── KPI Row ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
            <MetricCard
              label="Countries Tracked"
              value={data.length}
              unit="EU/EEA states"
              accent="#00d4aa"
            />
            <MetricCard
              label="Critical Risk"
              value={criticalCount}
              unit="countries"
              sub="Immediate intervention needed"
              accent="#ef4444"
            />
            <MetricCard
              label="High Risk"
              value={highCount}
              unit="countries"
              sub="Monitoring required"
              accent="#f97316"
            />
            <MetricCard
              label="Avg Retirement Cliff"
              value={avgCliffScore}
              unit="% over 55"
              sub="EU median"
              accent="#eab308"
            />
          </div>

          {/* ── View Toggle + Filter ──────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-1">
              {(['table', 'chart'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-[9px] font-mono tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                    view === v
                      ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40'
                      : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {v === 'table' ? '☰ Country Table' : '▦ Charts'}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`text-[9px] font-mono tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                    filterRisk === r
                      ? 'border-white/20 text-zinc-200 bg-zinc-800'
                      : 'border-white/5 text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Content ──────────────────────────────────────── */}
          <div className={`grid gap-6 ${selected ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

            {/* Table or Charts */}
            <div className={selected ? 'lg:col-span-2' : 'col-span-1'}>
              {view === 'table' ? (
                <div className="border border-white/5 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-950/60 px-4">
                        <th className="text-left text-[9px] font-mono tracking-widest text-zinc-500 uppercase pb-2 pt-3 pl-4">Country</th>
                        <th className="text-left text-[9px] font-mono tracking-widest text-zinc-500 uppercase pb-2 pt-3">Risk</th>
                        <SortHeader label="Physicians /100k" k="totalPhysicians" />
                        <SortHeader label="Cliff %" k="retirementCliffScore" />
                        <SortHeader label="Pipeline" k="pipelineRatio" />
                        <th className="text-left text-[9px] font-mono tracking-widest text-zinc-500 uppercase pb-2 pt-3">10yr Outlook</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(country => {
                        const meta = COUNTRIES[country.code]
                        return (
                          <tr
                            key={country.code}
                            className={`country-row ${selected === country.code ? 'selected' : ''}`}
                            onClick={() => setSelected(selected === country.code ? null : country.code)}
                          >
                            <td className="py-3 pl-4 pr-2">
                              <div className="font-serif text-sm text-zinc-200">{meta?.name ?? country.code}</div>
                              <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
                                {meta?.region ?? ''}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <StatusBadge risk={country.shortageRisk} />
                            </td>
                            <td className="py-3 pr-4 font-mono text-sm text-zinc-300">
                              {fmt(country.totalPhysicians)}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(country.retirementCliffScore ?? 0, 100)}%`,
                                      background: (country.retirementCliffScore ?? 0) > 40 ? '#ef4444' : '#eab308',
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-xs text-zinc-400">
                                  {fmt(country.retirementCliffScore, 0)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-zinc-400">
                              {fmt(country.pipelineRatio)}
                            </td>
                            <td className="py-3 pr-4">
                              {country.projectedShortfall10yr !== null ? (
                                <span
                                  className="font-mono text-xs"
                                  style={{
                                    color: country.projectedShortfall10yr > 0 ? '#ef4444' : '#10b981',
                                  }}
                                >
                                  {country.projectedShortfall10yr > 0 ? '▼' : '▲'}{' '}
                                  {Math.abs(country.projectedShortfall10yr)}%
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-zinc-700">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="border-t border-white/5 px-4 py-2 text-[9px] font-mono text-zinc-700">
                    {sorted.length} countries · Click row to drill down
                  </div>
                </div>
              ) : (
                /* Charts View */
                <div className="space-y-6">
                  {/* Retirement Cliff Bar */}
                  <div className="border border-white/5 p-5">
                    <div className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-4">
                      Retirement Cliff Score — % of Physicians Aged 55+
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={cliffChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#1f1f2e" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'DM Mono' }} />
                        <YAxis tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'DM Mono' }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="cliff" name="% over 55" radius={[2, 2, 0, 0]}>
                          {cliffChartData.map((d, i) => (
                            <Cell
                              key={i}
                              fill={
                                d.risk === 'CRITICAL' ? '#ef4444' :
                                d.risk === 'HIGH' ? '#f97316' :
                                d.risk === 'MODERATE' ? '#eab308' : '#10b981'
                              }
                              opacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pipeline vs Cliff Scatter */}
                  <div className="border border-white/5 p-5">
                    <div className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-4">
                      Pipeline Ratio vs Retirement Cliff — Risk Quadrant
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#1f1f2e" />
                        <XAxis
                          dataKey="cliff"
                          name="Retirement Cliff %"
                          tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'DM Mono' }}
                          label={{ value: 'Retirement Cliff %', position: 'insideBottom', offset: -5, fill: '#3f3f5a', fontSize: 9, fontFamily: 'DM Mono' }}
                        />
                        <YAxis
                          dataKey="pipeline"
                          name="Pipeline Ratio"
                          tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'DM Mono' }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3', stroke: '#3f3f5a' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="bg-zinc-900 border border-white/10 p-3 text-xs font-mono">
                                <div className="text-zinc-300 font-bold mb-1">{d.name}</div>
                                <div className="text-zinc-500">Cliff: {d.cliff?.toFixed(1)}%</div>
                                <div className="text-zinc-500">Pipeline: {d.pipeline?.toFixed(1)}</div>
                              </div>
                            )
                          }}
                        />
                        <Scatter
                          data={cliffChartData}
                          fill="#00d4aa"
                        >
                          {cliffChartData.map((d, i) => (
                            <Cell
                              key={i}
                              fill={
                                d.risk === 'CRITICAL' ? '#ef4444' :
                                d.risk === 'HIGH' ? '#f97316' :
                                d.risk === 'MODERATE' ? '#eab308' : '#10b981'
                              }
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-3 flex-wrap">
                      {['CRITICAL','HIGH','MODERATE','LOW'].map(r => (
                        <div key={r} className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
                          <RiskDot risk={r} />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Detail Panel ────────────────────────────────────── */}
            {selected && selectedCountry && (
              <div className="border border-white/5 bg-zinc-950/40 p-6 space-y-6 animate-fade-up">
                {/* Header */}
                <div className="border-b border-white/5 pb-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase mb-1">
                        Selected · {COUNTRIES[selected]?.region ?? ''} Europe
                      </div>
                      <h2 className="font-serif text-2xl font-light text-zinc-100">
                        {COUNTRIES[selected]?.name ?? selected}
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-zinc-600 hover:text-zinc-400 text-lg"
                    >
                      ×
                    </button>
                  </div>
                  <StatusBadge risk={selectedCountry.shortageRisk} />
                </div>

                {/* Core metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Physicians"
                    value={selectedCountry.totalPhysicians !== null ? selectedCountry.totalPhysicians.toFixed(1) : null}
                    unit="per 100k"
                    accent="#00d4aa"
                  />
                  <MetricCard
                    label="Grads/yr"
                    value={selectedCountry.medicalGraduates !== null ? selectedCountry.medicalGraduates.toFixed(1) : null}
                    unit="per 100k"
                    accent="#4fc3f7"
                  />
                  <MetricCard
                    label="Under 35"
                    value={selectedCountry.physiciansUnder35 !== null ? selectedCountry.physiciansUnder35.toFixed(1) : null}
                    unit="per 100k"
                    accent="#a78bfa"
                  />
                  <MetricCard
                    label="Over 55"
                    value={selectedCountry.physiciansOver55 !== null ? selectedCountry.physiciansOver55.toFixed(1) : null}
                    unit="per 100k"
                    accent="#f97316"
                  />
                </div>

                {/* Forecast bars */}
                <div>
                  <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 mb-3">
                    Workforce Sustainability Indicators
                  </div>
                  <ForecastBar
                    retirementCliff={selectedCountry.retirementCliffScore}
                    pipelineRatio={selectedCountry.pipelineRatio}
                    shortfall10yr={selectedCountry.projectedShortfall10yr}
                  />
                </div>

                {/* Radar vs EU avg */}
                {(() => {
                  const avgTotal = data.filter(d => d.totalPhysicians).reduce((s,d) => s+d.totalPhysicians!,0) / data.filter(d => d.totalPhysicians).length
                  const avgCliffR = data.filter(d => d.retirementCliffScore).reduce((s,d) => s+d.retirementCliffScore!,0) / data.filter(d => d.retirementCliffScore).length
                  const avgPipe = data.filter(d => d.pipelineRatio).reduce((s,d) => s+d.pipelineRatio!,0) / data.filter(d => d.pipelineRatio).length
                  const radarData = [
                    { metric: 'Density', country: Math.round((selectedCountry.totalPhysicians ?? 0) / (avgTotal || 1) * 50), eu: 50 },
                    { metric: 'Pipeline', country: Math.round((selectedCountry.pipelineRatio ?? 0) / (avgPipe || 1) * 50), eu: 50 },
                    { metric: 'Young Docs', country: Math.round((selectedCountry.physiciansUnder35 ?? 0) / ((selectedCountry.totalPhysicians || 1)) * 100), eu: 25 },
                    { metric: 'Cliff Risk', country: Math.max(0, 100 - (selectedCountry.retirementCliffScore ?? 50)), eu: 60 },
                  ]
                  return (
                    <div>
                      <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 mb-3">
                        vs EU Average (normalized)
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#2a2a3a" />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'DM Mono' }}
                          />
                          <Radar name={COUNTRIES[selected]?.name} dataKey="country" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.15} />
                          <Radar name="EU Avg" dataKey="eu" stroke="#3f3f5a" fill="#3f3f5a" fillOpacity={0.1} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {/* Interpretation */}
                <div className="border-t border-white/5 pt-4">
                  <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 mb-2">
                    System Interpretation
                  </div>
                  <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                    {selectedCountry.shortageRisk === 'CRITICAL' &&
                      `${COUNTRIES[selected]?.name} faces severe workforce sustainability risk. With ${selectedCountry.retirementCliffScore ?? '?'}% of physicians aged over 55 and a pipeline ratio of ${selectedCountry.pipelineRatio?.toFixed(1) ?? '?'}, the system cannot replace retiring physicians at current graduation rates.`}
                    {selectedCountry.shortageRisk === 'HIGH' &&
                      `${COUNTRIES[selected]?.name} shows high workforce vulnerability. Retirement wave pressure is significant and graduate pipeline requires strengthening to avoid medium-term shortages.`}
                    {selectedCountry.shortageRisk === 'MODERATE' &&
                      `${COUNTRIES[selected]?.name} maintains moderate workforce sustainability. Monitoring of age distribution trends and graduate output is recommended.`}
                    {selectedCountry.shortageRisk === 'LOW' &&
                      `${COUNTRIES[selected]?.name} demonstrates strong workforce sustainability with a healthy age distribution and adequate graduate pipeline.`}
                    {selectedCountry.shortageRisk === 'UNKNOWN' &&
                      `Insufficient data available for ${COUNTRIES[selected]?.name} to generate a full workforce risk assessment.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Methodology Footer ─────────────────────────────────── */}
          <div className="border-t border-white/5 pt-6 pb-8">
            <div className="text-[9px] font-mono tracking-widest text-zinc-700 uppercase mb-3">Methodology</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-mono text-zinc-600 leading-relaxed">
              <div>
                <span className="text-zinc-500">Retirement Cliff Score</span><br />
                Percentage of practising physicians aged 55 or older. Above 40% indicates a high-risk retirement wave within 10 years.
              </div>
              <div>
                <span className="text-zinc-500">Pipeline Ratio</span><br />
                Annual medical graduates per 100 current physicians. Below 5 indicates insufficient replacement capacity.
              </div>
              <div>
                <span className="text-zinc-500">Data Source</span><br />
                Eurostat Dissemination API. Datasets: hlth_rs_phys, hlth_rs_physage, hlth_rs_physcases. Refreshed weekly via cron.
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
