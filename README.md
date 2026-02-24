# European Physician Workforce Crisis Monitor

> Real-time early warning system tracking physician workforce sustainability across 31 European healthcare systems.

Live data from **Eurostat's public API**. No notebooks. No manual data exports. Deploys in under 10 minutes.

---

## What It Does

- Tracks physician density, age distribution, and graduate pipeline across EU/EEA
- Computes a **Retirement Cliff Score** (% of physicians aged 55+)
- Computes a **Pipeline Ratio** (graduates per 100 current physicians)  
- Generates a 10-year workforce shortfall projection per country
- Classifies countries: `CRITICAL` / `HIGH` / `MODERATE` / `LOW`
- Auto-refreshes from Eurostat weekly via Vercel cron

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | Supabase (Postgres) — optional |
| Data | Eurostat Dissemination API |
| Deployment | Vercel |

---

## Deploy in 10 Minutes

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/workforce-crisis-monitor
cd workforce-crisis-monitor
npm install
```

### 2. Set up Supabase (optional but recommended)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase-schema.sql` → Run
3. Go to **Settings → API** → copy your URL and keys

> **Without Supabase**: The app still works — it fetches live from Eurostat on every request. Supabase just adds caching and faster load times.

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Fill in your Supabase values (or leave blank to use live Eurostat)
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Seed the database (first time only)

```bash
curl http://localhost:3000/api/sync/workforce
```

### 6. Deploy to Vercel

```bash
npx vercel
# Or connect your GitHub repo at vercel.com
```

Add your environment variables in Vercel dashboard → Settings → Environment Variables.

The `vercel.json` file configures a weekly cron job (Monday 4am UTC) to auto-refresh data.

---

## Data Sources

| Indicator | Eurostat Dataset |
|-----------|-----------------|
| Total physicians | `hlth_rs_phys` |
| Physicians by age | `hlth_rs_physage` |
| Medical graduates | `hlth_rs_physcases` |

All data is public and freely available via the [Eurostat Dissemination API](https://ec.europa.eu/eurostat/web/main/data/web-services).

---

## Methodology

**Retirement Cliff Score** = (Physicians aged 55+) / (Total physicians) × 100  
*Above 40% = high risk of retirement wave within 10 years*

**Pipeline Ratio** = (Annual graduates) / (Total physicians) × 100  
*Below 5 = insufficient replacement capacity*

**10-Year Projected Shortfall** = (Physicians over 55) − (10 × annual graduates)  
*Expressed as % of current workforce*

**Risk Classification**:
- `CRITICAL`: Cliff > 40% AND Pipeline < 5
- `HIGH`: Cliff > 35% OR Pipeline < 6  
- `MODERATE`: Cliff > 25% OR Pipeline < 8
- `LOW`: All indicators within safe thresholds

---

## Project Structure

```
workforce-crisis-monitor/
├── app/
│   ├── api/
│   │   ├── sync/workforce/route.ts   ← Eurostat → Supabase sync
│   │   └── workforce/route.ts        ← Data API for frontend
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      ← Main dashboard
├── components/
│   ├── ForecastBar.tsx
│   ├── MetricCard.tsx
│   └── StatusBadge.tsx
├── lib/
│   ├── countries.ts                  ← Country metadata
│   ├── eurostat.ts                   ← Data fetching + scoring logic
│   └── supabase.ts                   ← DB client
├── supabase-schema.sql               ← Run once in Supabase
├── vercel.json                       ← Weekly cron config
└── .env.example                      ← Copy to .env.local
```

---

## Part of the EU Health Intelligence Suite

This tool is one of 10 interconnected platforms built for WHO/EU health policy analysis. See the full suite at [your-portfolio-url].
