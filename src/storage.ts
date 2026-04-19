import type { AppState, Genre } from './types'
import { nanoid } from './utils'
import { createEmpireGenre } from './data/empireSeeds'

const KEY = 'fleetBuilder_v3'
const PREV_KEYS = ['fleetBuilder_v2', 'fleetBuilder_v1']

function defaultState(): AppState {
  const empire = createEmpireGenre()
  return { genres: [empire], activeGenreId: empire.id }
}

/** Patch any Empire genre ships that are missing URLs from the seed. */
function patchEmpireUrls(genres: Genre[]): Genre[] {
  const seed = createEmpireGenre()
  const seedMap = new Map(seed.shipTypes.map(s => [s.id, s.url]))
  return genres.map(g => {
    if (g.id !== 'genre_empire') return g
    return {
      ...g,
      shipTypes: g.shipTypes.map(s => (!s.url && seedMap.has(s.id) ? { ...s, url: seedMap.get(s.id) } : s)),
    }
  })
}

function parseGenres(raw: string): { genres: Genre[]; activeGenreId: string | null } {
  const p = JSON.parse(raw)

  // Current format: has a genres array
  if (Array.isArray(p.genres)) {
    return { genres: p.genres, activeGenreId: p.activeGenreId ?? null }
  }

  // Pre-genre flat format
  const fleets = Array.isArray(p.fleets) && p.fleets.length > 0
    ? p.fleets
    : Array.isArray(p.fleetEntries) && p.fleetEntries.length > 0
      ? [{ id: nanoid(), name: 'Fleet 1', entries: p.fleetEntries }]
      : []
  const genre: Genre = {
    id: nanoid(),
    name: 'Default',
    shipTypes: Array.isArray(p.shipTypes) ? p.shipTypes : [],
    unitTypes: Array.isArray(p.unitTypes) ? p.unitTypes : [],
    fleets,
  }
  return { genres: [genre], activeGenreId: genre.id }
}

export function loadState(): AppState {
  try {
    const sources = [KEY, ...PREV_KEYS].map(k => localStorage.getItem(k))
    const raw = sources.find(r => r !== null)
    if (!raw) return defaultState()

    const { genres: rawGenres, activeGenreId } = parseGenres(raw)

    // Ensure Empire exists, then patch any missing URLs
    const hasEmpire = rawGenres.some(g => g.id === 'genre_empire')
    const genres = patchEmpireUrls(hasEmpire ? rawGenres : [...rawGenres, createEmpireGenre()])

    return { genres, activeGenreId: activeGenreId ?? genres[0]?.id ?? null }
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}
