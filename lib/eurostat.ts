// ─────────────────────────────────────────────────────────────────────────────
//  Eurostat API — Workforce Data Fetcher
//  Pulls physician data by age group + medical graduates + population
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data'

export interface CountryWorkforceRaw {
  code: string
  totalPhysicians: number | null      // per 100k
  physiciansUnder35: number | null    // per 100k
  physicians35to54: number | null     // per 100k
  physiciansOver55: number | null     // per 100k
  medicalGraduates: number | null     // per 100k
  year: number
}

// ─── Generic Eurostat JSON parser ────────────────────────────────────────────
function parseEurostat(json: any): Record<string, number> {
  const result: Record<string, number> = {}
  const dims = json.dimension
  const geoIndex: Record<string, number> = dims.geo?.category?.index ?? {}
  const timeIndex: Record<string, number> = dims.time?.category?.index ?? {}
  const values: Record<number, number> = json.value
  const size: number[] = json.size
  const ids: string[] = json.id

  const geoPos = ids.indexOf('geo')
  const timePos = ids.indexOf('time')

  // Find most recent year
  const latestYear = Object.entries(timeIndex)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  const latestTimeIdx = timeIndex[latestYear]

  Object.entries(geoIndex).forEach(([code, geoIdx]) => {
    let flatIdx: number
    // Handle both dim orderings
    if (ids.length === 2) {
      flatIdx = geoPos === 0
        ? geoIdx * size[1] + latestTimeIdx
        : latestTimeIdx * size[1] + geoIdx
    } else {
      // Multi-dim: find the flat index for geo+time combination
      // We iterate all indices and pick geo=geoIdx, time=latestTimeIdx
      const otherDims = ids.filter(d => d !== 'geo' && d !== 'time')
      // Take first value of all other dims (index 0)
      let base = 0
      let stride = 1
      for (let i = ids.length - 1; i >= 0; i--) {
        const dim = ids[i]
        let idx = 0
        if (dim === 'geo') idx = geoIdx
        else if (dim === 'time') idx = latestTimeIdx
        base += idx * stride
        stride *= size[i]
      }
      flatIdx = base
    }
    if (values[flatIdx] !== undefined && values[flatIdx] !== null) {
      result[code] = values[flatIdx]
    }
  })

  return result
}

// ─── Fetch a single Eurostat dataset ─────────────────────────────────────────
async function fetchDataset(
  dataset: string,
  params: Record<string, string>
): Promise<Record<string, number> | null> {
  const query = new URLSearchParams({ format: 'JSON', lang: 'EN', ...params })
  const url = `${BASE}/${dataset}?${query}`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h
    if (!res.ok) return null
    const json = await res.json()
    return parseEurostat(json)
  } catch {
    return null
  }
}

// ─── Main export: fetch all workforce indicators ──────────────────────────────
export async function fetchWorkforceData(): Promise<CountryWorkforceRaw[]> {
  const [
    totalPhys,
    physUnder35,
    phys35to54,
    physOver55,
    graduates,
  ] = await Promise.all([
    // Total physicians per 100k
    fetchDataset('hlth_rs_phys', { unit: 'P_HTHAB', isco08: 'OC221' }),
    // Physicians under 35
    fetchDataset('hlth_rs_physage', { unit: 'P_HTHAB', age: 'Y_LT35' }),
    // Physicians 35–54
    fetchDataset('hlth_rs_physage', { unit: 'P_HTHAB', age: 'Y35-54' }),
    // Physicians 55+
    fetchDataset('hlth_rs_physage', { unit: 'P_HTHAB', age: 'Y_GE55' }),
    // Medical graduates per 100k
    fetchDataset('hlth_rs_physcases', { unit: 'P_HTHAB', isco08: 'OC221' }),
  ])

  const allCodes = new Set([
    ...Object.keys(totalPhys ?? {}),
    ...Object.keys(physUnder35 ?? {}),
    ...Object.keys(physOver55 ?? {}),
  ])

  const EU_CODES = new Set([
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
    'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
    'PL','PT','RO','SK','SI','ES','SE','NO','IS','CH','TR',
  ])

  const results: CountryWorkforceRaw[] = []

  allCodes.forEach(code => {
    if (!EU_CODES.has(code)) return
    results.push({
      code,
      totalPhysicians: totalPhys?.[code] ?? null,
      physiciansUnder35: physUnder35?.[code] ?? null,
      physicians35to54: phys35to54?.[code] ?? null,
      physiciansOver55: physOver55?.[code] ?? null,
      medicalGraduates: graduates?.[code] ?? null,
      year: new Date().getFullYear() - 1,
    })
  })

  return results
}

// ─── Compute derived scores ───────────────────────────────────────────────────
export interface CountryWorkforceScored extends CountryWorkforceRaw {
  retirementCliffScore: number | null   // % of physicians over 55 (0-100)
  pipelineRatio: number | null          // graduates per 100 current physicians
  shortageRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN'
  projectedShortfall10yr: number | null // estimated % workforce loss
}

export function scoreWorkforceData(
  raw: CountryWorkforceRaw[]
): CountryWorkforceScored[] {
  return raw.map(country => {
    const { totalPhysicians, physiciansOver55, medicalGraduates } = country

    // Retirement cliff: what % of workforce is 55+?
    const retirementCliffScore =
      totalPhysicians && physiciansOver55
        ? Math.round((physiciansOver55 / totalPhysicians) * 100)
        : null

    // Pipeline ratio: graduates per 100 current physicians
    const pipelineRatio =
      totalPhysicians && medicalGraduates && totalPhysicians > 0
        ? Math.round((medicalGraduates / totalPhysicians) * 100 * 10) / 10
        : null

    // 10yr projected shortfall: (retiring 55+ physicians) minus (10yrs of graduates)
    const projectedShortfall10yr =
      physiciansOver55 && medicalGraduates && totalPhysicians
        ? Math.round(
            ((physiciansOver55 - medicalGraduates * 10) / totalPhysicians) * 100
          )
        : null

    // Risk classification
    let shortageRisk: CountryWorkforceScored['shortageRisk'] = 'UNKNOWN'
    if (retirementCliffScore !== null && pipelineRatio !== null) {
      if (retirementCliffScore > 40 && pipelineRatio < 5) shortageRisk = 'CRITICAL'
      else if (retirementCliffScore > 35 || pipelineRatio < 6) shortageRisk = 'HIGH'
      else if (retirementCliffScore > 25 || pipelineRatio < 8) shortageRisk = 'MODERATE'
      else shortageRisk = 'LOW'
    }

    return { ...country, retirementCliffScore, pipelineRatio, shortageRisk, projectedShortfall10yr }
  })
}
