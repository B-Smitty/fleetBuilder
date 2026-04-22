import * as yaml from 'js-yaml'
import type { Genre, ShipType, UnitType, UnitComponent, Fleet, FleetEntry } from './types'
import { nanoid } from './utils'

// ---------------------------------------------------------------------------
// Serialisation types (names instead of IDs so files are portable)
// ---------------------------------------------------------------------------
interface SerialShip {
  name: string
  cost?: number
  class?: string
  url?: string
}

interface SerialComp {
  type: 'ship' | 'unit'
  name: string
  quantity?: number
}

interface SerialUnit {
  name: string
  description?: string
  components?: SerialComp[]
}

interface SerialEntry {
  type: 'ship' | 'unit'
  name: string
  quantity?: number
}

interface SerialFleet {
  name: string
  entries?: SerialEntry[]
}

interface SerialGenre {
  ships?: SerialShip[]
  units?: SerialUnit[]
  fleets?: SerialFleet[]
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
function serialise(genre: Genre): SerialGenre {
  const shipName = (id: string) =>
    genre.shipTypes.find(s => s.id === id)?.name ?? '(deleted)'
  const unitName = (id: string) =>
    genre.unitTypes.find(u => u.id === id)?.name ?? '(deleted)'

  return {
    ships: genre.shipTypes.map(s => ({
      name: s.name,
      cost: s.costPerShip,
      ...(s.shipClass ? { class: s.shipClass } : {}),
      ...(s.url       ? { url:   s.url       } : {}),
    })),
    units: genre.unitTypes.map(ut => ({
      name: ut.name,
      ...(ut.description ? { description: ut.description } : {}),
      components: ut.components.map(c => ({
        type: c.type,
        name: c.type === 'ship' ? shipName(c.refId) : unitName(c.refId),
        quantity: c.quantity,
      })),
    })),
    fleets: genre.fleets.map(f => ({
      name: f.name,
      entries: f.entries.map(e => ({
        type: e.type,
        name: e.type === 'ship' ? shipName(e.refId) : unitName(e.refId),
        quantity: e.quantity,
      })),
    })),
  }
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportGenreYaml(genre: Genre) {
  const data    = serialise(genre)
  const content = yaml.dump(data, { lineWidth: 120, noRefs: true, quotingType: '"' })
  const base    = genre.name.replace(/[^a-z0-9]+/gi, '_')
  triggerDownload(content, `${base}.yaml`, 'text/yaml')
}

export function exportGenreJson(genre: Genre) {
  const data    = serialise(genre)
  const content = JSON.stringify(data, null, 2)
  const base    = genre.name.replace(/[^a-z0-9]+/gi, '_')
  triggerDownload(content, `${base}.json`, 'application/json')
}

// ---------------------------------------------------------------------------
// Import result
// ---------------------------------------------------------------------------
export interface ImportSummary {
  ships:  { created: number; updated: number }
  units:  { created: number; updated: number; unresolved: string[] }
  fleets: { created: number; updated: number; unresolved: string[] }
}

export interface ImportResult {
  genre:   Genre
  summary: ImportSummary
}

// ---------------------------------------------------------------------------
// Import (upsert by name, two-pass for units)
// ---------------------------------------------------------------------------
export function importIntoGenre(genre: Genre, text: string, filename: string): ImportResult {
  const isYaml = /\.(ya?ml)$/i.test(filename)
  const raw = isYaml ? yaml.load(text) : JSON.parse(text)

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    throw new Error('File must contain an object with ships / units / fleets keys.')

  const data = raw as SerialGenre

  const summary: ImportSummary = {
    ships:  { created: 0, updated: 0 },
    units:  { created: 0, updated: 0, unresolved: [] },
    fleets: { created: 0, updated: 0, unresolved: [] },
  }

  // ── Ships ──────────────────────────────────────────────────────────────────
  let shipTypes = [...genre.shipTypes]
  // name (lower) → ShipType (always reflects latest version)
  const shipByName = new Map<string, ShipType>(
    shipTypes.map(s => [s.name.toLowerCase(), s])
  )

  for (const s of data.ships ?? []) {
    const name = s.name?.trim()
    if (!name) continue
    const key      = name.toLowerCase()
    const existing = shipByName.get(key)

    if (existing) {
      const updated: ShipType = {
        ...existing,
        costPerShip: typeof s.cost === 'number' ? s.cost : existing.costPerShip,
        shipClass:   s.class?.trim()  || existing.shipClass,
        url:         s.url?.trim()    || existing.url,
      }
      shipTypes = shipTypes.map(st => st.id === existing.id ? updated : st)
      shipByName.set(key, updated)
      summary.ships.updated++
    } else {
      const created: ShipType = {
        id:          nanoid(),
        name,
        costPerShip: typeof s.cost === 'number' ? s.cost : 0,
        shipClass:   s.class?.trim()  || undefined,
        url:         s.url?.trim()    || undefined,
      }
      shipTypes.push(created)
      shipByName.set(key, created)
      summary.ships.created++
    }
  }

  // ── Units — pass 1: create or identify every unit shell ───────────────────
  let unitTypes = [...genre.unitTypes]
  const unitByName = new Map<string, UnitType>(
    unitTypes.map(u => [u.name.toLowerCase(), u])
  )

  // Track which serial units we need to wire up in pass 2
  const toWire: Array<{ serial: SerialUnit; id: string }> = []

  for (const u of data.units ?? []) {
    const name = u.name?.trim()
    if (!name) continue
    const key      = name.toLowerCase()
    const existing = unitByName.get(key)

    if (existing) {
      // Update description if provided; components handled in pass 2
      const updated: UnitType = {
        ...existing,
        description: u.description?.trim() || existing.description,
      }
      unitTypes = unitTypes.map(ut => ut.id === existing.id ? updated : ut)
      unitByName.set(key, updated)
      toWire.push({ serial: u, id: existing.id })
      summary.units.updated++
    } else {
      const created: UnitType = {
        id:          nanoid(),
        name,
        description: u.description?.trim() || undefined,
        components:  [],
      }
      unitTypes.push(created)
      unitByName.set(key, created)
      toWire.push({ serial: u, id: created.id })
      summary.units.created++
    }
  }

  // ── Units — pass 2: resolve component refs ────────────────────────────────
  const unitUnresolved = new Set<string>()

  for (const { serial, id } of toWire) {
    const components: UnitComponent[] = []

    for (const c of serial.components ?? []) {
      const cname = c.name?.trim()
      if (!cname || !c.type) continue
      const qty = typeof c.quantity === 'number' && c.quantity > 0 ? c.quantity : 1

      if (c.type === 'ship') {
        const ship = shipByName.get(cname.toLowerCase())
        if (ship) {
          components.push({ type: 'ship', refId: ship.id, quantity: qty })
        } else {
          unitUnresolved.add(cname)
        }
      } else {
        const unit = unitByName.get(cname.toLowerCase())
        if (unit) {
          components.push({ type: 'unit', refId: unit.id, quantity: qty })
        } else {
          unitUnresolved.add(cname)
        }
      }
    }

    unitTypes = unitTypes.map(ut =>
      ut.id === id ? { ...ut, components } : ut
    )
  }

  summary.units.unresolved = [...unitUnresolved]

  // ── Fleets ─────────────────────────────────────────────────────────────────
  let fleets = [...genre.fleets]
  const fleetByName = new Map<string, Fleet>(
    fleets.map(f => [f.name.toLowerCase(), f])
  )
  const fleetUnresolved = new Set<string>()

  for (const f of data.fleets ?? []) {
    const name = f.name?.trim()
    if (!name) continue
    const key = name.toLowerCase()

    const entries: FleetEntry[] = []
    for (const e of f.entries ?? []) {
      const ename = e.name?.trim()
      if (!ename || !e.type) continue
      const qty = typeof e.quantity === 'number' && e.quantity > 0 ? e.quantity : 1

      if (e.type === 'ship') {
        const ship = shipByName.get(ename.toLowerCase())
        if (ship) {
          entries.push({ id: nanoid(), type: 'ship', refId: ship.id, quantity: qty })
        } else {
          fleetUnresolved.add(ename)
        }
      } else {
        const unit = unitByName.get(ename.toLowerCase())
        if (unit) {
          entries.push({ id: nanoid(), type: 'unit', refId: unit.id, quantity: qty })
        } else {
          fleetUnresolved.add(ename)
        }
      }
    }

    const existing = fleetByName.get(key)
    if (existing) {
      fleets = fleets.map(fl => fl.id === existing.id ? { ...fl, entries } : fl)
      summary.fleets.updated++
    } else {
      const created: Fleet = { id: nanoid(), name, entries }
      fleets.push(created)
      fleetByName.set(key, created)
      summary.fleets.created++
    }
  }

  summary.fleets.unresolved = [...fleetUnresolved]

  return { genre: { ...genre, shipTypes, unitTypes, fleets }, summary }
}

// ---------------------------------------------------------------------------
// Human-readable summary string
// ---------------------------------------------------------------------------
export function summariseImport(s: ImportSummary): { message: string; ok: boolean } {
  const parts: string[] = []

  if (s.ships.created || s.ships.updated)
    parts.push(`Ships: ${s.ships.created} created, ${s.ships.updated} updated`)

  if (s.units.created || s.units.updated)
    parts.push(`Units: ${s.units.created} created, ${s.units.updated} updated`)

  if (s.fleets.created || s.fleets.updated)
    parts.push(`Fleets: ${s.fleets.created} created, ${s.fleets.updated} updated`)

  const unresolved = [
    ...s.units.unresolved.map(n => `"${n}"`),
    ...s.fleets.unresolved.map(n => `"${n}"`),
  ]

  const ok = parts.length > 0
  let message = ok ? parts.join(' · ') : 'Nothing to import.'
  if (unresolved.length)
    message += ` ⚠ Unresolved refs: ${[...new Set(unresolved)].join(', ')}`

  return { message, ok }
}
