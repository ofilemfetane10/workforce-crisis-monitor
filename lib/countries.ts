export interface Country {
  code: string
  name: string
  region: 'Northern' | 'Southern' | 'Eastern' | 'Western' | 'Candidate'
}

export const COUNTRIES: Record<string, Country> = {
  AT: { code: 'AT', name: 'Austria', region: 'Western' },
  BE: { code: 'BE', name: 'Belgium', region: 'Western' },
  BG: { code: 'BG', name: 'Bulgaria', region: 'Eastern' },
  HR: { code: 'HR', name: 'Croatia', region: 'Eastern' },
  CY: { code: 'CY', name: 'Cyprus', region: 'Southern' },
  CZ: { code: 'CZ', name: 'Czechia', region: 'Eastern' },
  DK: { code: 'DK', name: 'Denmark', region: 'Northern' },
  EE: { code: 'EE', name: 'Estonia', region: 'Northern' },
  FI: { code: 'FI', name: 'Finland', region: 'Northern' },
  FR: { code: 'FR', name: 'France', region: 'Western' },
  DE: { code: 'DE', name: 'Germany', region: 'Western' },
  GR: { code: 'GR', name: 'Greece', region: 'Southern' },
  HU: { code: 'HU', name: 'Hungary', region: 'Eastern' },
  IS: { code: 'IS', name: 'Iceland', region: 'Northern' },
  IE: { code: 'IE', name: 'Ireland', region: 'Northern' },
  IT: { code: 'IT', name: 'Italy', region: 'Southern' },
  LV: { code: 'LV', name: 'Latvia', region: 'Northern' },
  LT: { code: 'LT', name: 'Lithuania', region: 'Northern' },
  LU: { code: 'LU', name: 'Luxembourg', region: 'Western' },
  MT: { code: 'MT', name: 'Malta', region: 'Southern' },
  NL: { code: 'NL', name: 'Netherlands', region: 'Western' },
  NO: { code: 'NO', name: 'Norway', region: 'Northern' },
  PL: { code: 'PL', name: 'Poland', region: 'Eastern' },
  PT: { code: 'PT', name: 'Portugal', region: 'Southern' },
  RO: { code: 'RO', name: 'Romania', region: 'Eastern' },
  SK: { code: 'SK', name: 'Slovakia', region: 'Eastern' },
  SI: { code: 'SI', name: 'Slovenia', region: 'Eastern' },
  ES: { code: 'ES', name: 'Spain', region: 'Southern' },
  SE: { code: 'SE', name: 'Sweden', region: 'Northern' },
  CH: { code: 'CH', name: 'Switzerland', region: 'Western' },
  TR: { code: 'TR', name: 'Türkiye', region: 'Candidate' },
}

export const REGION_COLORS: Record<string, string> = {
  Northern: '#4fc3f7',
  Southern: '#ff7043',
  Eastern: '#ab47bc',
  Western: '#00d4aa',
  Candidate: '#ffd54f',
}
