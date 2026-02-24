-- ─────────────────────────────────────────────────────────────────────────────
--  Workforce Crisis Monitor — Supabase Schema
--  Run this in your Supabase SQL Editor (dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists workforce_metrics (
  id                      uuid default gen_random_uuid() primary key,
  country_code            text not null,
  year                    int  not null,

  -- Raw Eurostat indicators (per 100k population)
  total_physicians        numeric,
  physicians_under35      numeric,
  physicians_35to54       numeric,
  physicians_over55       numeric,
  medical_graduates       numeric,

  -- Computed scores
  retirement_cliff_score  numeric,   -- % of physicians over 55
  pipeline_ratio          numeric,   -- graduates per 100 current physicians
  shortage_risk           text,      -- CRITICAL | HIGH | MODERATE | LOW | UNKNOWN
  projected_shortfall_10yr numeric,  -- % workforce loss in 10 years

  -- Metadata
  synced_at               timestamptz default now(),

  -- Unique constraint: one row per country per year
  unique(country_code, year)
);

-- Enable Row Level Security (read-only for anonymous users)
alter table workforce_metrics enable row level security;

create policy "Public read access"
  on workforce_metrics for select
  using (true);

-- Index for fast lookups
create index if not exists idx_workforce_country on workforce_metrics(country_code);
create index if not exists idx_workforce_year    on workforce_metrics(year);
create index if not exists idx_workforce_risk    on workforce_metrics(shortage_risk);

-- ─────────────────────────────────────────────────────────────────────────────
-- After running this, call your sync endpoint once to populate:
--   curl -X GET https://your-app.vercel.app/api/sync/workforce
-- ─────────────────────────────────────────────────────────────────────────────
