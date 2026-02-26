# European Physician Workforce Crisis Monitor

> Real-time early warning system tracking physician workforce sustainability across 31 European healthcare systems.

Live data from **Eurostat’s public API**. No notebooks. No manual exports. Deploys in under 10 minutes.

## What It Does

- Tracks **physician density**, **age distribution**, and **training pipeline** across the EU/EEA  
- Computes a **Retirement Cliff Score** (% of physicians aged 55+)  
- Computes a **Pipeline Ratio** (annual graduates per 100 practising physicians)  
- Generates a **10-year workforce shortfall projection** for each country  
- Classifies countries into risk tiers: `CRITICAL`, `HIGH`, `MODERATE`, `LOW`  
- Auto-refreshes data weekly from Eurostat via **Vercel Cron**

## Tech Stack

| Layer | Technology |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | Supabase (Postgres) — optional |
| Data | Eurostat Dissemination API |

