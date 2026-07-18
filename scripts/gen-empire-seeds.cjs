const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const yamlPath = path.join(__dirname, '..', 'yaml', 'Imperial_Navy.yaml')
const outPath = path.join(__dirname, '..', 'src', 'data', 'empireSeeds.ts')

const doc = yaml.load(fs.readFileSync(yamlPath, 'utf8'))

function pad(n, width) {
  return String(n).padStart(width, '0')
}

function q(str) {
  return `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

const shipIdByName = new Map()
const shipLines = doc.ships.map((s, i) => {
  const id = `e${pad(i + 1, 3)}`
  shipIdByName.set(s.name, id)
  const parts = [
    `id: ${q(id)}`,
    `name: ${q(s.name)}`,
    `costPerShip: ${s.cost}`,
  ]
  if (s.class) parts.push(`shipClass: ${q(s.class)}`)
  if (s.url) parts.push(`url: ${q(s.url)}`)
  return `      { ${parts.join(', ')} },`
})

const unitIdByName = new Map()
doc.units.forEach((u, i) => {
  unitIdByName.set(u.name, `e_u${pad(i + 1, 3)}`)
})

function refFor(component) {
  if (component.type === 'ship') {
    const id = shipIdByName.get(component.name)
    if (!id) throw new Error(`Unknown ship referenced: ${component.name}`)
    return id
  } else if (component.type === 'unit') {
    const id = unitIdByName.get(component.name)
    if (!id) throw new Error(`Unknown unit referenced: ${component.name}`)
    return id
  }
  throw new Error(`Unknown component type: ${component.type}`)
}

const unitLines = doc.units.map((u) => {
  const id = unitIdByName.get(u.name)
  const compLines = u.components.map((c) => {
    return `        { type: ${q(c.type)}, refId: ${q(refFor(c))}, quantity: ${c.quantity} },`
  })
  const descLine = u.description ? `\n        description: ${q(u.description.trim())},` : ''
  return `      { id: ${q(id)}, name: ${q(u.name)},${descLine} components: [\n${compLines.join('\n')}\n      ] },`
})

const fleetLines = doc.fleets.map((f, fi) => {
  const fleetId = `e_f${pad(fi + 1, 3)}`
  const entryLines = f.entries.map((e, ei) => {
    const entryId = `${fleetId}_e${pad(ei + 1, 3)}`
    return `        { id: ${q(entryId)}, type: ${q(e.type)}, refId: ${q(refFor(e))}, quantity: ${e.quantity} },`
  })
  return `      { id: ${q(fleetId)}, name: ${q(f.name)}, entries: [\n${entryLines.join('\n')}\n      ] },`
})

const output = `import type { Genre } from '../types'

export function createEmpireGenre(): Genre {
  return {
    id: 'genre_empire',
    name: 'Empire',
    shipTypes: [
${shipLines.join('\n')}
    ],
    unitTypes: [
${unitLines.join('\n')}
    ],
    fleets: [
${fleetLines.join('\n')}
    ],
  }
}
`

fs.writeFileSync(outPath, output)
console.log(`Wrote ${outPath}`)
console.log(`Ships: ${doc.ships.length}, Units: ${doc.units.length}, Fleets: ${doc.fleets.length}`)
