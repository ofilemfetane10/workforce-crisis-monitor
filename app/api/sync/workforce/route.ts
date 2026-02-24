import { NextRequest, NextResponse } from "next/server";

// Force Node runtime + avoid static optimization
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper: normalize auth
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // if no secret set, don't block (dev-friendly)

  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  // Auth check
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Import INSIDE handler so Vercel build doesn't choke if env is missing
  const { fetchWorkforceData, scoreWorkforceData } = await import("@/lib/eurostat");
  const { supabaseAdmin } = await import("@/lib/supabase");

  try {
    console.log("[sync] Fetching workforce data from Eurostat...");
    const raw = await fetchWorkforceData();
    const scored = scoreWorkforceData(raw);

    if (!Array.isArray(scored) || scored.length === 0) {
      return NextResponse.json(
        { error: "No data returned from Eurostat" },
        { status: 502 }
      );
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

    const { error } = await db
      .from("workforce_metrics")
      .upsert(rows, { onConflict: "country_code,year" });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      countries: rows.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[sync] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Sync failed" },
      { status: 500 }
    );
  }
}

// Allow GET so you can trigger from browser during dev
export async function GET(req: NextRequest) {
  return POST(req);
}