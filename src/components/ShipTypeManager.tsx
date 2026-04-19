import { useState } from 'react'
import type { Genre, ShipType } from '../types'
import { nanoid } from '../utils'
import ShipLink from './ShipLink'

interface Props {
  genre: Genre
  updateGenre: (updater: (g: Genre) => Genre) => void
}

interface Form {
  name: string
  costPerShip: number
  url: string
}

const blank = (): Form => ({ name: '', costPerShip: 0, url: '' })

export default function ShipTypeManager({ genre, updateGenre }: Props) {
  const [form, setForm] = useState<Form>(blank())
  const [editingId, setEditingId] = useState<string | null>(null)

  function startEdit(ship: ShipType) {
    setEditingId(ship.id)
    setForm({ name: ship.name, costPerShip: ship.costPerShip, url: ship.url ?? '' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(blank())
  }

  function save() {
    if (!form.name.trim()) return
    const entry = { name: form.name.trim(), costPerShip: form.costPerShip, url: form.url.trim() || undefined }
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

  const isEditing = editingId !== null

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Ship Types</h2>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-400 mb-3">{isEditing ? 'Editing ship type' : 'New ship type'}</p>
        <div className="flex gap-3 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="e.g. Fighter"
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

      {genre.shipTypes.length === 0 ? (
        <p className="text-gray-500 text-sm">No ship types defined yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium text-right">Cost / Ship</th>
              <th className="pb-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {genre.shipTypes.map(ship => (
              <tr
                key={ship.id}
                className={`border-b border-gray-800 ${editingId === ship.id ? 'text-blue-300' : ''}`}
              >
                <td className="py-2.5">
                  <ShipLink name={ship.name} url={ship.url} />
                </td>
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
    </div>
  )
}
