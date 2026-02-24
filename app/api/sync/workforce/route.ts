cimport { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  //  hard-stop if running in build phase (prevents collect page data crash)
  if (process.env.VERCEL_ENV === "production" && process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json({ ok: true, skipped: "build-phase" });
  }

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) return unauthorized();
  }

  try {
    // import only at runtime
    const { fetchWorkforceData, scoreWorkforceData } = await import("@/lib/eurostat");
    const { supabaseAdmin } = await import("@/lib/supabase");

    const raw = await fetchWorkforceData();
    const scored = scoreWorkforceData(raw);

    if (!scored?.length) {
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
      countries: rows.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Sync failed" }, { status: 500 });
  }
}