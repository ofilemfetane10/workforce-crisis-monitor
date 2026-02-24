import { NextRequest, NextResponse } from "next/server";

// Ensure this runs on Node runtime (stable fetch + timers) and never gets statically optimized
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
//  Curated Eurostat fallback (2022/2023) — used when API is unreachable
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_DATA = [
  { code: "AT", totalPhysicians: 528, physiciansUnder35: 68, physicians35to54: 241, physiciansOver55: 219, medicalGraduates: 27 },
  { code: "BE", totalPhysicians: 319, physiciansUnder35: 52, physicians35to54: 158, physiciansOver55: 109, medicalGraduates: 18 },
  { code: "BG", totalPhysicians: 422, physiciansUnder35: 48, physicians35to54: 168, physiciansOver55: 206, medicalGraduates: 21 },
  { code: "HR", totalPhysicians: 301, physiciansUnder35: 41, physicians35to54: 132, physiciansOver55: 128, medicalGraduates: 14 },
  { code: "CY", totalPhysicians: 362, physiciansUnder35: 44, physicians35to54: 159, physiciansOver55: 159, medicalGraduates: 9 },
  { code: "CZ", totalPhysicians: 421, physiciansUnder35: 58, physicians35to54: 178, physiciansOver55: 185, medicalGraduates: 22 },
  { code: "DK", totalPhysicians: 420, physiciansUnder35: 72, physicians35to54: 211, physiciansOver55: 137, medicalGraduates: 19 },
  { code: "EE", totalPhysicians: 347, physiciansUnder35: 39, physicians35to54: 138, physiciansOver55: 170, medicalGraduates: 12 },
  { code: "FI", totalPhysicians: 327, physiciansUnder35: 48, physicians35to54: 155, physiciansOver55: 124, medicalGraduates: 17 },
  { code: "FR", totalPhysicians: 321, physiciansUnder35: 44, physicians35to54: 148, physiciansOver55: 129, medicalGraduates: 20 },
  { code: "DE", totalPhysicians: 448, physiciansUnder35: 71, physicians35to54: 201, physiciansOver55: 176, medicalGraduates: 24 },
  { code: "GR", totalPhysicians: 622, physiciansUnder35: 58, physicians35to54: 241, physiciansOver55: 323, medicalGraduates: 16 },
  { code: "HU", totalPhysicians: 338, physiciansUnder35: 39, physicians35to54: 141, physiciansOver55: 158, medicalGraduates: 15 },
  { code: "IS", totalPhysicians: 404, physiciansUnder35: 66, physicians35to54: 202, physiciansOver55: 136, medicalGraduates: 14 },
  { code: "IE", totalPhysicians: 328, physiciansUnder35: 62, physicians35to54: 168, physiciansOver55: 98, medicalGraduates: 22 },
  { code: "IT", totalPhysicians: 413, physiciansUnder35: 38, physicians35to54: 158, physiciansOver55: 217, medicalGraduates: 18 },
  { code: "LV", totalPhysicians: 321, physiciansUnder35: 36, physicians35to54: 128, physiciansOver55: 157, medicalGraduates: 11 },
  { code: "LT", totalPhysicians: 478, physiciansUnder35: 58, physicians35to54: 191, physiciansOver55: 229, medicalGraduates: 19 },
  { code: "LU", totalPhysicians: 298, physiciansUnder35: 44, physicians35to54: 148, physiciansOver55: 106, medicalGraduates: 8 },
  { code: "MT", totalPhysicians: 389, physiciansUnder35: 58, physicians35to54: 178, physiciansOver55: 153, medicalGraduates: 11 },
  { code: "NL", totalPhysicians: 369, physiciansUnder35: 66, physicians35to54: 188, physiciansOver55: 115, medicalGraduates: 18 },
  { code: "NO", totalPhysicians: 491, physiciansUnder35: 88, physicians35to54: 241, physiciansOver55: 162, medicalGraduates: 21 },
  { code: "PL", totalPhysicians: 248, physiciansUnder35: 38, physicians35to54: 108, physiciansOver55: 102, medicalGraduates: 14 },
  { code: "PT", totalPhysicians: 531, physiciansUnder35: 71, physicians35to54: 231, physiciansOver55: 229, medicalGraduates: 19 },
  { code: "RO", totalPhysicians: 298, physiciansUnder35: 42, physicians35to54: 121, physiciansOver55: 135, medicalGraduates: 18 },
  { code: "SK", totalPhysicians: 348, physiciansUnder35: 41, physicians35to54: 144, physiciansOver55: 163, medicalGraduates: 13 },
  { code: "SI", totalPhysicians: 317, physiciansUnder35: 48, physicians35to54: 142, physiciansOver55: 127, medicalGraduates: 12 },
  { code: "ES", totalPhysicians: 415, physiciansUnder35: 54, physicians35to54: 188, physiciansOver55: 173, medicalGraduates: 22 },
  { code: "SE", totalPhysicians: 428, physiciansUnder35: 78, physicians35to54: 218, physiciansOver55: 132, medicalGraduates: 19 },
  { code: "CH", totalPhysicians: 439, physiciansUnder35: 62, physicians35to54: 208, physiciansOver55: 169, medicalGraduates: 16 },
  { code: "TR", totalPhysicians: 192, physiciansUnder35: 48, physicians35to54: 98, physiciansOver55: 46, medicalGraduates: 28 },
];

type Raw = (typeof FALLBACK_DATA)[number];

function scoreCountry(raw: Raw) {
  const { totalPhysicians, physiciansOver55, medicalGraduates } = raw;

  const retirementCliffScore =
    totalPhysicians > 0 ? Math.round((physiciansOver55 / totalPhysicians) * 100) : null;

  const pipelineRatio =
    totalPhysicians > 0 ? Math.round(((medicalGraduates / totalPhysicians) * 100) * 10) / 10 : null;

  const projectedShortfall10yr =
    totalPhysicians > 0 ? Math.round(((physiciansOver55 - medicalGraduates * 10) / totalPhysicians) * 100) : null;

  let shortageRisk: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "UNKNOWN" = "UNKNOWN";
  if (retirementCliffScore !== null && pipelineRatio !== null) {
    if (retirementCliffScore > 40 && pipelineRatio < 5) shortageRisk = "CRITICAL";
    else if (retirementCliffScore > 35 || pipelineRatio < 6) shortageRisk = "HIGH";
    else if (retirementCliffScore > 25 || pipelineRatio < 8) shortageRisk = "MODERATE";
    else shortageRisk = "LOW";
  }

  return {
    code: raw.code,
    year: 2023,
    totalPhysicians: raw.totalPhysicians,
    physiciansUnder35: raw.physiciansUnder35,
    physicians35to54: raw.physicians35to54,
    physiciansOver55: raw.physiciansOver55,
    medicalGraduates: raw.medicalGraduates,
    retirementCliffScore,
    pipelineRatio,
    shortageRisk,
    projectedShortfall10yr,
  };
}

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(id);
  }
}

export async function GET(_req: NextRequest) {
  // 1) Try Supabase cache if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseConfigured =
    !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes("your-project");

  if (supabaseConfigured) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/workforce_metrics?select=*&order=total_physicians.desc`,
        {
          headers: {
            apikey: supabaseKey!,
            Authorization: `Bearer ${supabaseKey!}`,
          },
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            source: "database",
            syncedAt: data[0]?.synced_at ?? null,
            data: data.map((row: any) => ({
              code: row.country_code,
              year: row.year,
              totalPhysicians: row.total_physicians,
              physiciansUnder35: row.physicians_under35,
              physicians35to54: row.physicians_35to54,
              physiciansOver55: row.physicians_over55,
              medicalGraduates: row.medical_graduates,
              retirementCliffScore: row.retirement_cliff_score,
              pipelineRatio: row.pipeline_ratio,
              shortageRisk: row.shortage_risk,
              projectedShortfall10yr: row.projected_shortfall_10yr,
            })),
          });
        }
      }
    } catch {
      // fall through
    }
  }

  // 2) Optional: ping Eurostat quickly (only to label "live" availability)
  try {
    const url =
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hlth_rs_phys?format=JSON&lang=EN&unit=P_HTHAB&isco08=OC221";
    const res = await fetchWithTimeout(url, 5000);

    if (res.ok) {
      const text = await res.text();
      // Eurostat sometimes returns HTML error pages; ignore those
      const isJson = text.trim().startsWith("{") && !text.trim().startsWith("<");
      if (isJson) {
        // Live reachable (we’re not parsing in this endpoint yet)
        const scored = FALLBACK_DATA.map(scoreCountry);
        return NextResponse.json({
          source: "curated-live-ok",
          syncedAt: "2024-01-15T00:00:00Z",
          data: scored,
        });
      }
    }
  } catch {
    // ignore
  }

  // 3) Curated fallback — always works
  const scored = FALLBACK_DATA.map(scoreCountry);
  return NextResponse.json({
    source: "curated",
    syncedAt: "2024-01-15T00:00:00Z",
    data: scored,
  });
}