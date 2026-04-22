import { useState, useRef } from 'react'
import type { Genre, UnitType, UnitComponent } from '../types'
import { nanoid } from '../utils'
import { unitTypeCost, reachableUnitIds } from '../costs'
import ShipLink from './ShipLink'
import MarkdownEditor from './MarkdownEditor'
import ReactMarkdown from 'react-markdown'

interface Props {
  genre: Genre
  updateGenre: (updater: (g: Genre) => Genre) => void
}

interface UnitForm {
  name: string
  description: string
  components: UnitComponent[]
}

interface NewComp {
  type: 'ship' | 'unit'
  refId: string
  quantity: number
}

type SortCol = 'name' | 'cost'

const blankForm = (): UnitForm => ({ name: '', description: '', components: [] })
const blankComp = (refId = ''): NewComp => ({ type: 'ship', refId, quantity: 1 })

export default function UnitTypeManager({ genre, updateGenre }: Props) {
  const [form, setForm] = useState<UnitForm>(blankForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const [newComp, setNewComp] = useState<NewComp>(() => blankComp(genre.shipTypes[0]?.id ?? ''))
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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
      const arr = [...g.unitTypes]
      const idx = arr.findIndex(u => u.id === id)
      const next = idx + delta
      if (next < 0 || next >= arr.length) return g
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return { ...g, unitTypes: arr }
    })
  }

  function startEdit(ut: UnitType) {
    setEditingId(ut.id)
    setForm({ name: ut.name, description: ut.description ?? '', components: [...ut.components] })
    setNewComp(blankComp(genre.shipTypes[0]?.id ?? ''))
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(blankForm())
    setNewComp(blankComp(genre.shipTypes[0]?.id ?? ''))
  }

  function save() {
    if (!form.name.trim()) return
    const cycleComp = form.components.find(
      c => c.type === 'unit' && (
        c.refId === editingId ||
        (editingId != null && reachableUnitIds(c.refId, genre.unitTypes).has(editingId))
      )
    )
    if (cycleComp) return
    if (editingId) {
      updateGenre(g => ({
        ...g,
        unitTypes: g.unitTypes.map(ut =>
          ut.id === editingId
            ? { ...ut, name: form.name.trim(), description: form.description.trim() || undefined, components: form.components }
            : ut,
        ),
      }))
      cancelEdit()
    } else {
      updateGenre(g => ({
        ...g,
        unitTypes: [...g.unitTypes, { id: nanoid(), name: form.name.trim(), description: form.description.trim() || undefined, components: form.components }],
      }))
      setForm(blankForm())
      setNewComp(blankComp(genre.shipTypes[0]?.id ?? ''))
    }
  }

  function wouldCreateCycle(refId: string): boolean {
    if (newComp.type !== 'unit') return false
    if (refId === editingId) return true
    if (editingId && reachableUnitIds(refId, genre.unitTypes).has(editingId)) return true
    return false
  }

  function addComponent() {
    if (!newComp.refId || newComp.quantity < 1) return
    if (wouldCreateCycle(newComp.refId)) return
    setForm(f => ({ ...f, components: [...f.components, { ...newComp }] }))
    setNewComp(c => ({ ...c, refId: '', quantity: 1 }))
  }

  function removeComponent(idx: number) {
    setForm(f => ({ ...f, components: f.components.filter((_, i) => i !== idx) }))
  }

  function updateComponentQty(idx: number, qty: number) {
    setForm(f => ({
      ...f,
      components: f.components.map((c, i) => (i === idx ? { ...c, quantity: qty } : c)),
    }))
  }

  function remove(id: string) {
    updateGenre(g => ({
      ...g,
      unitTypes: g.unitTypes
        .filter(ut => ut.id !== id)
        .map(ut => ({
          ...ut,
          components: ut.components.filter(c => !(c.type === 'unit' && c.refId === id)),
        })),
      fleets: g.fleets.map(f => ({
        ...f,
        entries: f.entries.filter(e => !(e.type === 'unit' && e.refId === id)),
      })),
    }))
    if (editingId === id) cancelEdit()
  }

  function setCompType(type: 'ship' | 'unit') {
    const refId =
      type === 'ship'
        ? (genre.shipTypes[0]?.id ?? '')
        : (availableUnits[0]?.id ?? '')
    setNewComp({ type, refId, quantity: 1 })
  }

  const availableUnits = genre.unitTypes.filter(ut => {
    if (ut.id === editingId) return false
    if (!editingId) return true
    return !reachableUnitIds(ut.id, genre.unitTypes).has(editingId)
  })

  function compNode(comp: UnitComponent) {
    if (comp.type === 'ship') {
      const ship = genre.shipTypes.find(s => s.id === comp.refId)
      return <ShipLink name={ship?.name ?? '(deleted)'} url={ship?.url} />
    }
    return <>{genre.unitTypes.find(u => u.id === comp.refId)?.name ?? '(deleted)'}</>
  }

  function compTypeLabel(comp: UnitComponent): string {
    if (comp.type === 'ship') {
      const ship = genre.shipTypes.find(s => s.id === comp.refId)
      return ship?.shipClass ?? 'Ship'
    }
    return 'Unit'
  }

  const isEditing = editingId !== null
  const compOptions = newComp.type === 'ship' ? genre.shipTypes : availableUnits
  const hiddenUnitCount = editingId
    ? genre.unitTypes.length - 1 - availableUnits.length
    : 0

  const displayed = sortCol
    ? [...genre.unitTypes].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortCol === 'name') return a.name.localeCompare(b.name) * dir
        const ca = unitTypeCost(a.id, genre.shipTypes, genre.unitTypes)
        const cb = unitTypeCost(b.id, genre.shipTypes, genre.unitTypes)
        return (ca - cb) * dir
      })
    : genre.unitTypes

  function sortIndicator(col: SortCol) {
    if (sortCol !== col) return <span className="ml-1 text-gray-600">⇅</span>
    return <span className="ml-1 text-blue-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Unit Types</h2>

      <div ref={formRef} className="bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-400 mb-3">{isEditing ? 'Editing unit type' : 'New unit type'}</p>

        <div className="flex gap-3 items-end mb-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Fighter Wing"
            />
          </div>
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
          >
            {isEditing ? 'Update' : 'Add Unit Type'}
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

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">Description <span className="text-gray-600">(optional, Markdown)</span></label>
          <MarkdownEditor
            value={form.description}
            onChange={v => setForm(f => ({ ...f, description: v }))}
            minRows={3}
          />
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">Components</p>
          {form.components.length === 0 ? (
            <p className="text-xs text-gray-500 mb-3">No components added yet.</p>
          ) : (
            <div className="space-y-1 mb-3">
              {form.components.map((comp, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-700 rounded px-3 py-1.5 text-sm">
                  <span className="text-xs text-gray-400 w-10 shrink-0 truncate" title={compTypeLabel(comp)}>
                    {compTypeLabel(comp)}
                  </span>
                  <span className="flex-1 truncate">{compNode(comp)}</span>
                  <input
                    type="number"
                    min={1}
                    value={comp.quantity}
                    onChange={e => updateComponentQty(i, Number(e.target.value))}
                    className="w-24 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-xs text-right"
                  />
                  <button
                    onClick={() => removeComponent(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors text-xs ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <select
              value={newComp.type}
              onChange={e => setCompType(e.target.value as 'ship' | 'unit')}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs"
            >
              <option value="ship">Ship</option>
              <option value="unit">Unit</option>
            </select>
            <select
              value={newComp.refId}
              onChange={e => setNewComp(c => ({ ...c, refId: e.target.value }))}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs"
              disabled={compOptions.length === 0}
            >
              {compOptions.length === 0 ? (
                <option value="">— none available —</option>
              ) : (
                <>
                  <option value="">— select —</option>
                  {compOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </>
              )}
            </select>
            <input
              type="number"
              min={1}
              value={newComp.quantity}
              onChange={e => setNewComp(c => ({ ...c, quantity: Number(e.target.value) }))}
              className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-right"
            />
            <button
              onClick={addComponent}
              disabled={!newComp.refId}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs transition-colors whitespace-nowrap"
            >
              + Add
            </button>
          </div>
          {newComp.type === 'unit' && hiddenUnitCount > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              {hiddenUnitCount} unit{hiddenUnitCount > 1 ? 's' : ''} hidden — adding {hiddenUnitCount > 1 ? 'them' : 'it'} would create a circular dependency.
            </p>
          )}
        </div>
      </div>

      {genre.unitTypes.length === 0 ? (
        <p className="text-gray-500 text-sm">No unit types defined yet.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-2 text-xs text-gray-400 border-b border-gray-700 pb-2">
            {!sortCol && <div className="w-16 shrink-0"></div>}
            <button
              onClick={() => toggleSort('name')}
              className="font-medium cursor-pointer select-none hover:text-gray-200 flex items-center"
            >
              Name{sortIndicator('name')}
            </button>
            <button
              onClick={() => toggleSort('cost')}
              className="ml-auto font-medium cursor-pointer select-none hover:text-gray-200 flex items-center"
            >
              Cost / Unit{sortIndicator('cost')}
            </button>
            <div className="w-16"></div>
          </div>

          <div className="space-y-2">
            {displayed.map((ut, i) => {
              const cost = unitTypeCost(ut.id, genre.shipTypes, genre.unitTypes)
              return (
                <div
                  key={ut.id}
                  className={`bg-gray-800 rounded-lg px-4 py-3 flex gap-2 items-start ${
                    editingId === ut.id ? 'ring-1 ring-blue-500' : ''
                  }`}
                >
                  {!sortCol && (
                    <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                      <button
                        onClick={() => move(ut.id, -1)}
                        disabled={i === 0}
                        className="px-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move(ut.id, 1)}
                        disabled={i === displayed.length - 1}
                        className="px-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{ut.name}</span>
                        <span className="ml-3 text-sm text-gray-400 font-mono">
                          {cost.toLocaleString()} / unit
                        </span>
                      </div>
                      <div className="space-x-3">
                        <button
                          onClick={() => startEdit(ut)}
                          className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(ut.id)}
                          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {ut.description && (
                      <div className="mt-2 prose prose-invert prose-sm max-w-none
                        prose-p:my-0.5 prose-headings:my-1 prose-ul:my-0.5 prose-ol:my-0.5
                        prose-li:my-0 prose-pre:bg-gray-900 prose-code:bg-gray-900
                        prose-code:px-1 prose-code:rounded prose-a:text-blue-400">
                        <ReactMarkdown>{ut.description}</ReactMarkdown>
                      </div>
                    )}
                    {ut.components.length > 0 && (
                      <div className="mt-2 space-y-0.5 pl-3 border-l border-gray-700">
                        {ut.components.map((comp, ci) => (
                          <div key={ci} className="text-xs text-gray-400">
                            {comp.quantity}× {compNode(comp)}{' '}
                            <span className="text-gray-600">({compTypeLabel(comp)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

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
    </div>
  )
}
