import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Optional auth
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { fetchWorkforceData, scoreWorkforceData } = await import("@/lib/eurostat");
    const { supabaseAdmin } = await import("@/lib/supabase");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If env missing, don’t crash build/deploy — just skip DB saving
    if (!supabaseUrl || !serviceKey) {
      const raw = await fetchWorkforceData();
      const scored = scoreWorkforceData(raw);
      return NextResponse.json({
        success: true,
        saved: false,
        message: "Supabase env vars missing. Returned computed data without saving.",
        countries: scored.length,
        syncedAt: new Date().toISOString(),
      });
    }

    const raw = await fetchWorkforceData();
    const scored = scoreWorkforceData(raw);

    if (!scored.length) {
      return NextResponse.json({ error: "No data returned from Eurostat" }, { status: 502 });
    }

    const db = supabaseAdmin();

    const rows = scored.map((c: any) => ({
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
    }));

    const { error } = await db.from("workforce_metrics").upsert(rows, {
      onConflict: "country_code,year",
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      saved: true,
      countries: rows.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Sync failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}