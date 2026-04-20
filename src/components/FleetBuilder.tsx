import { useState } from 'react'
import type { Genre, Fleet, FleetEntry } from '../types'
import { nanoid } from '../utils'
import { shipTypeCost, unitTypeCost, fleetTotalCost } from '../costs'
import ShipLink from './ShipLink'

interface Props {
  genre: Genre
  updateGenre: (updater: (g: Genre) => Genre) => void
}

type SortCol = 'name' | 'type' | 'qty' | 'unitCost' | 'subtotal'

export default function FleetBuilder({ genre, updateGenre }: Props) {
  const [activeFleetId, setActiveFleetId] = useState<string | null>(
    () => genre.fleets[0]?.id ?? null,
  )
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [addType, setAddType] = useState<'ship' | 'unit'>('unit')
  const [addRefId, setAddRefId] = useState('')
  const [addQty, setAddQty] = useState(1)
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const activeFleet: Fleet | null =
    genre.fleets.find(f => f.id === activeFleetId) ?? genre.fleets[0] ?? null

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function clearSort() {
    setSortCol(null)
  }

  function newFleet() {
    const fleet: Fleet = {
      id: nanoid(),
      name: `Fleet ${genre.fleets.length + 1}`,
      entries: [],
    }
    updateGenre(g => ({ ...g, fleets: [...g.fleets, fleet] }))
    setActiveFleetId(fleet.id)
  }

  function deleteFleet() {
    if (!activeFleet) return
    const remaining = genre.fleets.filter(f => f.id !== activeFleet.id)
    updateGenre(g => ({ ...g, fleets: remaining }))
    setActiveFleetId(remaining[0]?.id ?? null)
  }

  function startRename() {
    if (!activeFleet) return
    setRenameValue(activeFleet.name)
    setRenaming(true)
  }

  function commitRename() {
    if (!activeFleet || !renameValue.trim()) return
    updateGenre(g => ({
      ...g,
      fleets: g.fleets.map(f =>
        f.id === activeFleet.id ? { ...f, name: renameValue.trim() } : f,
      ),
    }))
    setRenaming(false)
  }

  function updateFleetEntries(updater: (entries: FleetEntry[]) => FleetEntry[]) {
    if (!activeFleet) return
    updateGenre(g => ({
      ...g,
      fleets: g.fleets.map(f =>
        f.id === activeFleet.id ? { ...f, entries: updater(f.entries) } : f,
      ),
    }))
  }

  function addToFleet() {
    if (!addRefId || addQty < 1 || !activeFleet) return
    updateFleetEntries(entries => [
      ...entries,
      { id: nanoid(), type: addType, refId: addRefId, quantity: addQty },
    ])
    setAddQty(1)
  }

  function removeEntry(entryId: string) {
    updateFleetEntries(entries => entries.filter(e => e.id !== entryId))
  }

  function updateQty(entryId: string, qty: number) {
    updateFleetEntries(entries =>
      entries.map(e => (e.id === entryId ? { ...e, quantity: qty } : e)),
    )
  }

  function moveEntry(entryId: string, delta: -1 | 1) {
    clearSort()
    updateFleetEntries(entries => {
      const arr = [...entries]
      const idx = arr.findIndex(e => e.id === entryId)
      const next = idx + delta
      if (next < 0 || next >= arr.length) return entries
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  function entryCost(entry: FleetEntry): number {
    if (entry.type === 'ship') return shipTypeCost(entry.refId, genre.shipTypes)
    return unitTypeCost(entry.refId, genre.shipTypes, genre.unitTypes)
  }

  function entryName(entry: FleetEntry): string {
    if (entry.type === 'ship')
      return genre.shipTypes.find(s => s.id === entry.refId)?.name ?? '(deleted)'
    return genre.unitTypes.find(u => u.id === entry.refId)?.name ?? '(deleted)'
  }

  function exportMarkdown() {
    if (!activeFleet) return

    const lines: string[] = []
    lines.push(`# ${activeFleet.name}`, `*Genre: ${genre.name}*`, '')

    if (activeFleet.entries.length === 0) {
      lines.push('*This fleet is empty.*')
    } else {
      lines.push('| Entry | Type | Qty | Unit Cost | Subtotal |')
      lines.push('|-------|------|----:|----------:|---------:|')
      for (const entry of activeFleet.entries) {
        const cost = entryCost(entry)
        lines.push(
          `| ${entryName(entry)} | ${entry.type === 'ship' ? (genre.shipTypes.find(s => s.id === entry.refId)?.shipClass ?? 'Ship') : 'Unit'} | ${entry.quantity} | ${cost.toLocaleString()} | ${(cost * entry.quantity).toLocaleString()} |`,
        )
      }
      const total = fleetTotalCost(activeFleet.entries, genre.shipTypes, genre.unitTypes)
      lines.push('', `**Total Fleet Cost: ${total.toLocaleString()}**`)

      const usedUnitIds: string[] = []
      const seen = new Set<string>()
      function collectUnits(unitId: string) {
        if (seen.has(unitId)) return
        seen.add(unitId)
        usedUnitIds.push(unitId)
        const ut = genre.unitTypes.find(u => u.id === unitId)
        if (ut) ut.components.forEach(c => { if (c.type === 'unit') collectUnits(c.refId) })
      }
      activeFleet.entries.forEach(e => { if (e.type === 'unit') collectUnits(e.refId) })

      if (usedUnitIds.length > 0) {
        lines.push('', '---', '', '## Unit Type Reference')
        for (const unitId of usedUnitIds) {
          const ut = genre.unitTypes.find(u => u.id === unitId)
          if (!ut) continue
          const cost = unitTypeCost(unitId, genre.shipTypes, genre.unitTypes)
          lines.push('', `### ${ut.name}`)
          for (const comp of ut.components) {
            const ship = comp.type === 'ship' ? genre.shipTypes.find(s => s.id === comp.refId) : null
            const name = ship?.name ?? (genre.unitTypes.find(u => u.id === comp.refId)?.name ?? '(deleted)')
            const label = ship ? (ship.shipClass ?? 'Ship') : 'Unit'
            lines.push(`- ${comp.quantity}× ${name} (${label})`)
          }
          lines.push('', `*Unit cost: ${cost.toLocaleString()}*`)
        }
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeFleet.name.replace(/[^a-z0-9]+/gi, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportFlatCsv() {
    if (!activeFleet) return

    // Recursively expand unit types into a ship-id → quantity map
    const shipCounts = new Map<string, number>()
    function addUnit(unitId: string, multiplier: number, visited: Set<string>) {
      if (visited.has(unitId)) return
      const ut = genre.unitTypes.find(u => u.id === unitId)
      if (!ut) return
      const next = new Set(visited).add(unitId)
      for (const comp of ut.components) {
        if (comp.type === 'ship') {
          shipCounts.set(comp.refId, (shipCounts.get(comp.refId) ?? 0) + comp.quantity * multiplier)
        } else {
          addUnit(comp.refId, comp.quantity * multiplier, next)
        }
      }
    }
    for (const entry of activeFleet.entries) {
      if (entry.type === 'ship') {
        shipCounts.set(entry.refId, (shipCounts.get(entry.refId) ?? 0) + entry.quantity)
      } else {
        addUnit(entry.refId, entry.quantity, new Set())
      }
    }

    // Build rows sorted by class then name
    type BomRow = { shipClass: string; name: string; qty: number; unitCost: number; subtotal: number }
    const rows: BomRow[] = []
    for (const [shipId, qty] of shipCounts) {
      const ship = genre.shipTypes.find(s => s.id === shipId)
      const name = ship?.name ?? '(deleted)'
      const unitCost = ship ? shipTypeCost(shipId, genre.shipTypes) : 0
      rows.push({ shipClass: ship?.shipClass ?? '', name, qty, unitCost, subtotal: unitCost * qty })
    }
    rows.sort((a, b) => a.shipClass.localeCompare(b.shipClass) || a.name.localeCompare(b.name))

    const grandTotal = rows.reduce((s, r) => s + r.subtotal, 0)
    const esc = (v: string) =>
      v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v

    const csvLines = [
      'Class,Ship,Qty,Unit Cost,Subtotal',
      ...rows.map(r => [esc(r.shipClass), esc(r.name), r.qty, r.unitCost, r.subtotal].join(',')),
      `,,,,${grandTotal}`,
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeFleet.name.replace(/[^a-z0-9]+/gi, '_')}_bom.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const options = addType === 'ship' ? genre.shipTypes : genre.unitTypes
  const rawEntries = activeFleet?.entries ?? []

  const entries = sortCol
    ? [...rawEntries].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortCol === 'name') return entryName(a).localeCompare(entryName(b)) * dir
        if (sortCol === 'type') return a.type.localeCompare(b.type) * dir
        if (sortCol === 'qty') return (a.quantity - b.quantity) * dir
        const ca = entryCost(a), cb = entryCost(b)
        if (sortCol === 'unitCost') return (ca - cb) * dir
        return (ca * a.quantity - cb * b.quantity) * dir
      })
    : rawEntries

  const totalCost = activeFleet
    ? fleetTotalCost(activeFleet.entries, genre.shipTypes, genre.unitTypes)
    : 0

  function sortIndicator(col: SortCol) {
    if (sortCol !== col) return <span className="ml-1 text-gray-600">⇅</span>
    return <span className="ml-1 text-blue-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  function SortTh({ col, children, className = '' }: { col: SortCol; children: React.ReactNode; className?: string }) {
    return (
      <th
        className={`pb-2 font-medium cursor-pointer select-none hover:text-gray-200 ${className}`}
        onClick={() => toggleSort(col)}
      >
        {children}{sortIndicator(col)}
      </th>
    )
  }

  return (
    <div>
      {/* Fleet selector bar */}
      <div className="flex items-center gap-2 mb-6">
        {renaming ? (
          <>
            <input
              className="bg-gray-700 border border-blue-500 rounded px-3 py-1.5 text-sm focus:outline-none"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              autoFocus
            />
            <button
              onClick={commitRename}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setRenaming(false)}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <select
              value={activeFleet?.id ?? ''}
              onChange={e => setActiveFleetId(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-blue-500"
            >
              {genre.fleets.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
              {genre.fleets.length === 0 && <option value="">— no fleets —</option>}
            </select>
            <button
              onClick={startRename}
              disabled={!activeFleet}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm transition-colors"
            >
              Rename
            </button>
            <button
              onClick={deleteFleet}
              disabled={!activeFleet}
              className="px-3 py-1.5 bg-gray-700 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm transition-colors"
            >
              Delete
            </button>
            <div className="ml-auto flex gap-2">
              <button
                onClick={exportFlatCsv}
                disabled={!activeFleet || activeFleet.entries.length === 0}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm transition-colors"
                title="Export flattened bill of materials as CSV"
              >
                Export BOM
              </button>
              <button
                onClick={exportMarkdown}
                disabled={!activeFleet || activeFleet.entries.length === 0}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm transition-colors"
                title="Export fleet as Markdown"
              >
                Export MD
              </button>
              <button
                onClick={newFleet}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
              >
                + New Fleet
              </button>
            </div>
          </>
        )}
      </div>

      {genre.fleets.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">⚓</p>
          <p className="text-sm mb-4">No fleets yet.</p>
          <button
            onClick={newFleet}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
          >
            + Create First Fleet
          </button>
        </div>
      ) : (
        <>
          {/* Add panel */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-400 mb-3">Add to fleet</p>
            <div className="flex gap-2 items-center">
              <select
                value={addType}
                onChange={e => { setAddType(e.target.value as 'ship' | 'unit'); setAddRefId('') }}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
              >
                <option value="unit">Unit Type</option>
                <option value="ship">Ship Type</option>
              </select>
              <select
                value={addRefId}
                onChange={e => setAddRefId(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
                disabled={options.length === 0}
              >
                {options.length === 0 ? (
                  <option value="">— none defined —</option>
                ) : (
                  <>
                    <option value="">— select —</option>
                    {options.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </>
                )}
              </select>
              <input
                type="number"
                min={1}
                value={addQty}
                onChange={e => setAddQty(Number(e.target.value))}
                className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm text-right font-mono"
              />
              <button
                onClick={addToFleet}
                disabled={!addRefId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Roster */}
          {entries.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">
              This fleet is empty. Add unit types or ships above.
            </p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    {!sortCol && <th className="pb-2 w-16"></th>}
                    <SortTh col="name">Entry</SortTh>
                    <SortTh col="type" className="w-20">Type</SortTh>
                    <SortTh col="qty" className="text-center w-24">Qty</SortTh>
                    <SortTh col="unitCost" className="text-right">Unit Cost</SortTh>
                    <SortTh col="subtotal" className="text-right">Subtotal</SortTh>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const cost = entryCost(entry)
                    return (
                      <tr key={entry.id} className="border-b border-gray-800">
                        {!sortCol && (
                          <td className="py-1.5">
                            <div className="flex gap-1">
                              <button
                                onClick={() => moveEntry(entry.id, -1)}
                                disabled={i === 0}
                                className="px-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                                title="Move up"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => moveEntry(entry.id, 1)}
                                disabled={i === entries.length - 1}
                                className="px-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                                title="Move down"
                              >
                                ▼
                              </button>
                            </div>
                          </td>
                        )}
                        <td className="py-2.5">
                          <span className="font-medium">
                            {entry.type === 'ship'
                              ? <ShipLink name={entryName(entry)} url={genre.shipTypes.find(s => s.id === entry.refId)?.url} />
                              : entryName(entry)}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-gray-500 uppercase tracking-wide">
                          {entry.type}
                        </td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            min={1}
                            value={entry.quantity}
                            onChange={e => updateQty(entry.id, Number(e.target.value))}
                            className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-right font-mono"
                          />
                        </td>
                        <td className="py-2.5 text-right font-mono text-gray-300">
                          {cost.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {(cost * entry.quantity).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-600">
                    <td colSpan={sortCol ? 4 : 5} className="pt-4 pb-1 text-gray-300 font-semibold">
                      Total Fleet Cost
                    </td>
                    <td className="pt-4 pb-1 text-right font-mono font-bold text-blue-400 text-xl">
                      {totalCost.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              {sortCol && (
                <button
                  onClick={clearSort}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ✕ Clear sort (restore manual order)
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
