import { NextRequest, NextResponse } from 'next/server'
import { fetchWorkforceData, scoreWorkforceData } from '@/lib/eurostat'
import { supabaseAdmin } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/sync/workforce
//  Fetches fresh data from Eurostat and upserts into Supabase.
//  Protected by CRON_SECRET header.
//
//  Call manually:  curl -X POST /api/sync/workforce \
//                    -H "Authorization: Bearer YOUR_CRON_SECRET"
//  On Vercel:      Set up a cron job in vercel.json (see below)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[sync] Fetching workforce data from Eurostat...')
    const raw = await fetchWorkforceData()
    const scored = scoreWorkforceData(raw)

    if (!scored.length) {
      return NextResponse.json({ error: 'No data returned from Eurostat' }, { status: 502 })
    }

    const db = supabaseAdmin()

    // Upsert all rows
    const rows = scored.map(c => ({
      country_code: c.code,
      year: c.year,
      total_physicians: c.totalPhysicians,
      physicians_under35: c.physiciansUnder35,
      physicians_35to54: c.physicians35to54,
      physicians_over55: c.physiciansOver55,
      medical_graduates: c.medicalGraduates,
      retirement_cliff_score: c.retirementCliffScore,
      pipeline_ratio: c.pipelineRatio,
      shortage_risk: c.shortageRisk,
      projected_shortfall_10yr: c.projectedShortfall10yr,
      synced_at: new Date().toISOString(),
    }))

    const { error } = await db
      .from('workforce_metrics')
      .upsert(rows, { onConflict: 'country_code,year' })

    if (error) throw error

    return NextResponse.json({
      success: true,
      countries: scored.length,
      syncedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[sync] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Allow GET so you can trigger from browser during dev
export async function GET(req: NextRequest) {
  return POST(req)
}
