import type { Genre } from '../types'
import { createEmpireGenre } from './empireSeeds'
import { createRebellionGenre } from './RebellionSeeds'
import { createRepublicGenre } from './RepublicSeeds'
import { createConfederacyGenre } from './ConfederacySeeds'

export function createAllGenre(): Genre {
  const sources = [
    createEmpireGenre(),
    createRebellionGenre(),
    createRepublicGenre(),
    createConfederacyGenre(),
  ]

  const seen = new Set<string>()
  const shipTypes = sources.flatMap(g => g.shipTypes).filter(s => {
    if (seen.has(s.name)) return false
    seen.add(s.name)
    return true
  })

  return {
    id: 'genre_all',
    name: 'All',
    shipTypes,
    unitTypes: [],
    fleets: [],
  }
}
