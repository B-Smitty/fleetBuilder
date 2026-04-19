import type { ShipType, UnitType, FleetEntry } from './types'

export function shipTypeCost(id: string, shipTypes: ShipType[]): number {
  return shipTypes.find(s => s.id === id)?.costPerShip ?? 0
}

export function unitTypeCost(
  id: string,
  shipTypes: ShipType[],
  unitTypes: UnitType[],
  visited = new Set<string>(),
): number {
  if (visited.has(id)) return 0
  visited.add(id)
  const ut = unitTypes.find(u => u.id === id)
  if (!ut) return 0
  return ut.components.reduce((sum, comp) => {
    if (comp.type === 'ship') {
      return sum + shipTypeCost(comp.refId, shipTypes) * comp.quantity
    }
    return sum + unitTypeCost(comp.refId, shipTypes, unitTypes, new Set(visited)) * comp.quantity
  }, 0)
}

export function fleetTotalCost(
  entries: FleetEntry[],
  shipTypes: ShipType[],
  unitTypes: UnitType[],
): number {
  return entries.reduce((sum, entry) => {
    if (entry.type === 'ship') {
      return sum + shipTypeCost(entry.refId, shipTypes) * entry.quantity
    }
    return sum + unitTypeCost(entry.refId, shipTypes, unitTypes) * entry.quantity
  }, 0)
}

/** All unit IDs reachable (transitively) from the given unit via its components. */
export function reachableUnitIds(unitTypeId: string, unitTypes: UnitType[]): Set<string> {
  const reachable = new Set<string>()
  const queue = [unitTypeId]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (reachable.has(id)) continue
    reachable.add(id)
    const ut = unitTypes.find(u => u.id === id)
    if (ut) {
      for (const comp of ut.components) {
        if (comp.type === 'unit') queue.push(comp.refId)
      }
    }
  }
  return reachable
}
