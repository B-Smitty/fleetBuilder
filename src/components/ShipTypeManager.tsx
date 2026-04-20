import { useState, useRef } from 'react'
import type { Genre, ShipType } from '../types'
import { nanoid } from '../utils'
import ShipLink from './ShipLink'

function escCsv(v: string) {
  return v.includes(',') || v.includes('"') || v.includes('\n')
    ? `"${v.replace(/"/g, '""')}"`
    : v
}

interface Props {
  genre: Genre
  updateGenre: (updater: (g: Genre) => Genre) => void
}

interface Form {
  name: string
  costPerShip: number
  shipClass: string
  url: string
}

type SortCol = 'name' | 'cost' | 'class'

const blank = (): Form => ({ name: '', costPerShip: 0, shipClass: '', url: '' })

export default function ShipTypeManager({ genre, updateGenre }: Props) {
  const [form, setForm] = useState<Form>(blank())
  const [editingId, setEditingId] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterClass, setFilterClass] = useState('')

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

  function move(id: string, delta: -1 | 1) {
    clearSort()
    updateGenre(g => {
      const arr = [...g.shipTypes]
      const idx = arr.findIndex(s => s.id === id)
      const next = idx + delta
      if (next < 0 || next >= arr.length) return g
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return { ...g, shipTypes: arr }
    })
  }

  function startEdit(ship: ShipType) {
    setEditingId(ship.id)
    setForm({ name: ship.name, costPerShip: ship.costPerShip, shipClass: ship.shipClass ?? '', url: ship.url ?? '' })
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(blank())
  }

  function save() {
    if (!form.name.trim()) return
    const entry = {
      name: form.name.trim(),
      costPerShip: form.costPerShip,
      shipClass: form.shipClass.trim() || undefined,
      url: form.url.trim() || undefined,
    }
    if (editingId) {
      updateGenre(g => ({
        ...g,
        shipTypes: g.shipTypes.map(st => st.id === editingId ? { ...st, ...entry } : st),
      }))
      cancelEdit()
    } else {
      updateGenre(g => ({
        ...g,
        shipTypes: [...g.shipTypes, { id: nanoid(), ...entry }],
      }))
      setForm(blank())
    }
  }

  function remove(id: string) {
    updateGenre(g => ({
      ...g,
      shipTypes: g.shipTypes.filter(st => st.id !== id),
      unitTypes: g.unitTypes.map(ut => ({
        ...ut,
        components: ut.components.filter(c => !(c.type === 'ship' && c.refId === id)),
      })),
      fleets: g.fleets.map(f => ({
        ...f,
        entries: f.entries.filter(e => !(e.type === 'ship' && e.refId === id)),
      })),
    }))
    if (editingId === id) cancelEdit()
  }

  const allClasses = Array.from(
    new Set(genre.shipTypes.map(s => s.shipClass).filter(Boolean) as string[])
  ).sort()

  const isEditing = editingId !== null

  const filtered = filterClass
    ? genre.shipTypes.filter(s => s.shipClass === filterClass)
    : genre.shipTypes

  const displayed = sortCol
    ? [...filtered].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortCol === 'name') return a.name.localeCompare(b.name) * dir
        if (sortCol === 'class') return (a.shipClass ?? '').localeCompare(b.shipClass ?? '') * dir
        return (a.costPerShip - b.costPerShip) * dir
      })
    : filtered

  function exportCsv() {
    const rows = [
      'name,cost,class,url',
      ...genre.shipTypes.map(s =>
        [escCsv(s.name), s.costPerShip, escCsv(s.shipClass ?? ''), escCsv(s.url ?? '')].join(',')
      ),
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${genre.name.replace(/[^a-z0-9]+/gi, '_')}_ships.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text = (ev.target?.result as string) ?? ''
        const lines = text.split(/\r?\n/).filter(l => l.trim())
        if (lines.length < 2) { setImportError('File appears empty.'); return }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const idx = {
          name: headers.indexOf('name'),
          cost: headers.findIndex(h => h === 'cost' || h === 'costpership'),
          cls:  headers.findIndex(h => h === 'class' || h === 'shipclass' || h === 'type'),
          url:  headers.indexOf('url'),
        }
        if (idx.name === -1 || idx.cost === -1) {
          setImportError('CSV must have at least "name" and "cost" columns.')
          return
        }

        function parseCsvRow(line: string): string[] {
          const cols: string[] = []
          let cur = '', inQuote = false
          for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (inQuote) {
              if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
              else if (ch === '"') inQuote = false
              else cur += ch
            } else {
              if (ch === '"') inQuote = true
              else if (ch === ',') { cols.push(cur); cur = '' }
              else cur += ch
            }
          }
          cols.push(cur)
          return cols
        }

        const existingNames = new Set(genre.shipTypes.map(s => s.name.toLowerCase()))
        const newShips: ShipType[] = []
        const skipped: string[] = []

        for (const line of lines.slice(1)) {
          const cols = parseCsvRow(line)
          const name = cols[idx.name]?.trim()
          if (!name) continue
          if (existingNames.has(name.toLowerCase())) { skipped.push(name); continue }
          const cost = Number(cols[idx.cost]?.trim() ?? 0)
          const shipClass = idx.cls !== -1 ? (cols[idx.cls]?.trim() || undefined) : undefined
          const url = idx.url !== -1 ? (cols[idx.url]?.trim() || undefined) : undefined
          newShips.push({ id: nanoid(), name, costPerShip: isNaN(cost) ? 0 : cost, shipClass, url })
          existingNames.add(name.toLowerCase())
        }

        if (newShips.length === 0) {
          setImportError(skipped.length > 0
            ? `All ${skipped.length} rows already exist — nothing imported.`
            : 'No valid rows found.')
          return
        }

        updateGenre(g => ({ ...g, shipTypes: [...g.shipTypes, ...newShips] }))
        const msg = `Imported ${newShips.length} ship${newShips.length > 1 ? 's' : ''}${skipped.length > 0 ? `, skipped ${skipped.length} duplicate${skipped.length > 1 ? 's' : ''}` : ''}.`
        setImportError(msg)
      } catch {
        setImportError('Failed to parse file.')
      }
    }
    reader.readAsText(file)
  }

  function sortIndicator(col: SortCol) {
    if (sortCol !== col) return <span className="ml-1 text-gray-600">⇅</span>
    return <span className="ml-1 text-blue-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Ship Classes</h2>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={genre.shipTypes.length === 0}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs transition-colors"
            title="Export ship classes as CSV"
          >
            Export CSV
          </button>
          <button
            onClick={() => { setImportError(null); importRef.current?.click() }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            title="Import ship classes from CSV"
          >
            Import CSV
          </button>
          <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
        </div>
      </div>
      {importError && (
        <p className={`text-xs mb-3 ${importError.startsWith('Imported') ? 'text-green-400' : 'text-amber-400'}`}>
          {importError}
        </p>
      )}

      <div ref={formRef} className="bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-400 mb-3">{isEditing ? 'Editing ship class' : 'New ship class'}</p>
        <div className="flex gap-3 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="e.g. Imperial I-class Star Destroyer"
              autoFocus
            />
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-400 mb-1">Cost per Ship</label>
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
              type="number"
              min={0}
              value={form.costPerShip}
              onChange={e => setForm(f => ({ ...f, costPerShip: Number(e.target.value) }))}
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          </div>
        </div>
        <div className="flex gap-3 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Class <span className="text-gray-600">(optional)</span></label>
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={form.shipClass}
              onChange={e => setForm(f => ({ ...f, shipClass: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="e.g. Star Destroyer"
              list="class-suggestions"
            />
            <datalist id="class-suggestions">
              {allClasses.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">URL <span className="text-gray-600">(optional)</span></label>
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="https://..."
            />
          </div>
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
          >
            {isEditing ? 'Update' : 'Add'}
          </button>
          {isEditing && (
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {allClasses.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Filter by class:</span>
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">All ({genre.shipTypes.length})</option>
            {allClasses.map(c => (
              <option key={c} value={c}>
                {c} ({genre.shipTypes.filter(s => s.shipClass === c).length})
              </option>
            ))}
          </select>
          {filterClass && (
            <button
              onClick={() => setFilterClass('')}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {genre.shipTypes.length === 0 ? (
        <p className="text-gray-500 text-sm">No ship classes defined yet.</p>
      ) : displayed.length === 0 ? (
        <p className="text-gray-500 text-sm">No ships match this filter.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              {!sortCol && <th className="pb-2 w-16"></th>}
              <th
                className="pb-2 font-medium cursor-pointer select-none hover:text-gray-200"
                onClick={() => toggleSort('name')}
              >
                Name{sortIndicator('name')}
              </th>
              <th
                className="pb-2 font-medium cursor-pointer select-none hover:text-gray-200"
                onClick={() => toggleSort('class')}
              >
                Class{sortIndicator('class')}
              </th>
              <th
                className="pb-2 font-medium text-right cursor-pointer select-none hover:text-gray-200"
                onClick={() => toggleSort('cost')}
              >
                Cost / Ship{sortIndicator('cost')}
              </th>
              <th className="pb-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((ship, i) => (
              <tr
                key={ship.id}
                className={`border-b border-gray-800 ${editingId === ship.id ? 'text-blue-300' : ''}`}
              >
                {!sortCol && (
                  <td className="py-1.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => move(ship.id, -1)}
                        disabled={i === 0}
                        className="px-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move(ship.id, 1)}
                        disabled={i === displayed.length - 1}
                        className="px-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                )}
                <td className="py-2.5">
                  <ShipLink name={ship.name} url={ship.url} />
                </td>
                <td className="py-2.5 text-gray-400 text-xs">{ship.shipClass ?? ''}</td>
                <td className="py-2.5 text-right font-mono">{ship.costPerShip.toLocaleString()}</td>
                <td className="py-2.5 text-right space-x-3">
                  <button
                    onClick={() => startEdit(ship)}
                    className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(ship.id)}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sortCol && (
        <button
          onClick={clearSort}
          className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ✕ Clear sort (restore manual order)
        </button>
      )}
    </div>
  )
}
