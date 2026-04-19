import { useState, useEffect } from 'react'
import type { AppState, Genre } from './types'
import { loadState, saveState } from './storage'
import { nanoid } from './utils'
import ShipTypeManager from './components/ShipTypeManager'
import UnitTypeManager from './components/UnitTypeManager'
import FleetBuilder from './components/FleetBuilder'

type Tab = 'fleet' | 'units' | 'ships'

const TABS: { key: Tab; label: string }[] = [
  { key: 'fleet', label: 'Fleet' },
  { key: 'units', label: 'Unit Types' },
  { key: 'ships', label: 'Ship Types' },
]

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>('fleet')
  const [genreRenaming, setGenreRenaming] = useState(false)
  const [genreRenameValue, setGenreRenameValue] = useState('')

  useEffect(() => { saveState(state) }, [state])

  const activeGenre: Genre | null =
    state.genres.find(g => g.id === state.activeGenreId) ?? state.genres[0] ?? null

  function updateGenre(updater: (g: Genre) => Genre) {
    if (!activeGenre) return
    setState(s => ({
      ...s,
      genres: s.genres.map(g => g.id === activeGenre.id ? updater(g) : g),
    }))
  }

  function newGenre() {
    const genre: Genre = {
      id: nanoid(),
      name: `Genre ${state.genres.length + 1}`,
      shipTypes: [],
      unitTypes: [],
      fleets: [],
    }
    setState(s => ({ ...s, genres: [...s.genres, genre], activeGenreId: genre.id }))
  }

  function deleteGenre() {
    if (!activeGenre) return
    const remaining = state.genres.filter(g => g.id !== activeGenre.id)
    setState(s => ({ ...s, genres: remaining, activeGenreId: remaining[0]?.id ?? null }))
  }

  function startGenreRename() {
    if (!activeGenre) return
    setGenreRenameValue(activeGenre.name)
    setGenreRenaming(true)
  }

  function commitGenreRename() {
    if (!activeGenre || !genreRenameValue.trim()) return
    setState(s => ({
      ...s,
      genres: s.genres.map(g =>
        g.id === activeGenre.id ? { ...g, name: genreRenameValue.trim() } : g,
      ),
    }))
    setGenreRenaming(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-wide text-blue-400">Fleet Builder</h1>
      </header>

      {/* Genre bar */}
      <div className="bg-gray-850 border-b border-gray-700 px-6 py-2 flex items-center gap-2 bg-gray-800/60">
        <span className="text-xs text-gray-500 uppercase tracking-wider mr-1">Genre</span>
        {genreRenaming ? (
          <>
            <input
              className="bg-gray-700 border border-blue-500 rounded px-3 py-1 text-sm focus:outline-none"
              value={genreRenameValue}
              onChange={e => setGenreRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitGenreRename()
                if (e.key === 'Escape') setGenreRenaming(false)
              }}
              autoFocus
            />
            <button
              onClick={commitGenreRename}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setGenreRenaming(false)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <select
              value={activeGenre?.id ?? ''}
              onChange={e => setState(s => ({ ...s, activeGenreId: e.target.value }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm font-medium focus:outline-none focus:border-blue-500"
            >
              {state.genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
              {state.genres.length === 0 && <option value="">— no genres —</option>}
            </select>
            <button
              onClick={startGenreRename}
              disabled={!activeGenre}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs transition-colors"
            >
              Rename
            </button>
            <button
              onClick={deleteGenre}
              disabled={!activeGenre}
              className="px-3 py-1 bg-gray-700 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs transition-colors"
            >
              Delete
            </button>
            <button
              onClick={newGenre}
              className="ml-auto px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
            >
              + New Genre
            </button>
          </>
        )}
      </div>

      {/* Tab bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <nav className="flex px-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              disabled={!activeGenre}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                tab === key
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <main className="p-6 max-w-4xl mx-auto">
        {!activeGenre ? (
          <div className="text-center py-24 text-gray-600">
            <p className="text-5xl mb-4">🌌</p>
            <p className="text-sm mb-4">No genres yet. Create one to get started.</p>
            <button
              onClick={newGenre}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            >
              + New Genre
            </button>
          </div>
        ) : (
          <>
            {tab === 'fleet' && <FleetBuilder genre={activeGenre} updateGenre={updateGenre} />}
            {tab === 'units' && <UnitTypeManager genre={activeGenre} updateGenre={updateGenre} />}
            {tab === 'ships' && <ShipTypeManager genre={activeGenre} updateGenre={updateGenre} />}
          </>
        )}
      </main>
    </div>
  )
}
