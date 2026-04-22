export interface ShipType {
  id: string
  name: string
  costPerShip: number
  shipClass?: string
  url?: string
}

export interface UnitComponent {
  type: 'ship' | 'unit'
  refId: string
  quantity: number
}

export interface UnitType {
  id: string
  name: string
  description?: string
  components: UnitComponent[]
}

export interface FleetEntry {
  id: string
  type: 'ship' | 'unit'
  refId: string
  quantity: number
}

export interface Fleet {
  id: string
  name: string
  entries: FleetEntry[]
}

export interface Genre {
  id: string
  name: string
  shipTypes: ShipType[]
  unitTypes: UnitType[]
  fleets: Fleet[]
}

export interface AppState {
  genres: Genre[]
  activeGenreId: string | null
}
