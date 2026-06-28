import type { Genre } from '../types'

export function createConfederacyGenre(): Genre {
  return {
    id: 'genre_cis',
    name: 'Confederacy',
    shipTypes: [
      { id: 'cis001', name: 'Vulture-class starfighter', costPerShip: 40000, shipClass: 'Droid starfighter', url: 'https://starwars.fandom.com/wiki/Vulture-class_starfighter' },
      { id: 'cis002', name: 'Droid tri-fighter', costPerShip: 40000, shipClass: 'Droid interceptor', url: 'https://starwars.fandom.com/wiki/Droid_tri-fighter' },
      { id: 'cis003', name: 'Hyena-class Droid Fighter/Bomber', costPerShip: 120000, shipClass: 'Droid bomber', url: 'https://starwars.fandom.com/wiki/Hyena-class_Droid_Fighter/Bomber' },
      { id: 'cis004', name: 'HMP droid gunship', costPerShip: 60000, shipClass: 'Droid gunship', url: 'https://starwars.fandom.com/wiki/HMP_droid_gunship' },
      { id: 'cis005', name: 'Nantex-class territorial defense starfighter', costPerShip: 35000, shipClass: 'Starfighter', url: 'https://starwars.fandom.com/wiki/Nantex-class_territorial_defense_starfighter' },
      { id: 'cis006', name: 'Scarab-class starfighter', costPerShip: 38000, shipClass: 'Droid starfighter', url: 'https://starwars.fandom.com/wiki/Scarab-class_starfighter' },
      { id: 'cis007', name: 'Belbullab-22 starfighter', costPerShip: 168000, shipClass: 'Starfighter', url: 'https://starwars.fandom.com/wiki/Belbullab-22_starfighter' },
      { id: 'cis008', name: 'Belbullab-22 heavy starfighter', costPerShip: 185000, shipClass: 'Heavy starfighter', url: 'https://starwars.fandom.com/wiki/Belbullab-22_heavy_starfighter' },
      { id: 'cis009', name: 'Ginivex-class fanblade starfighter', costPerShip: 180000, shipClass: 'Interceptor', url: 'https://starwars.fandom.com/wiki/Ginivex-class_fanblade_starfighter' },
      { id: 'cis010', name: 'Mankvim-814 light interceptor', costPerShip: 70000, shipClass: 'Interceptor', url: 'https://starwars.fandom.com/wiki/Mankvim-814_light_interceptor' },
      { id: 'cis011', name: 'Porax-38 starfighter', costPerShip: 85000, shipClass: 'Starfighter', url: 'https://starwars.fandom.com/wiki/Porax-38_starfighter' },
      { id: 'cis012', name: 'Rogue-class Porax-38 starfighter', costPerShip: 90000, shipClass: 'Starfighter', url: 'https://starwars.fandom.com/wiki/Rogue-class_Porax-38_starfighter' },
      { id: 'cis013', name: 'Zenuas 33 Umbaran starfighter', costPerShip: 145000, shipClass: 'Starfighter', url: 'https://starwars.fandom.com/wiki/Zenuas_33_Umbaran_starfighter' },
      { id: 'cis014', name: 'Cutlass-9 patrol fighter', costPerShip: 55000, shipClass: 'Patrol fighter', url: 'https://starwars.fandom.com/wiki/Cutlass-9_patrol_fighter' },
      { id: 'cis015', name: 'Lucrehulk-class battleship', costPerShip: 200000000, shipClass: 'Battleship / Droid control ship', url: 'https://starwars.fandom.com/wiki/Lucrehulk-class_battleship' },
      { id: 'cis016', name: 'Subjugator-class heavy cruiser', costPerShip: 850000000, shipClass: 'Heavy cruiser', url: 'https://starwars.fandom.com/wiki/Subjugator-class_heavy_cruiser' },
      { id: 'cis017', name: 'Providence-class carrier/destroyer', costPerShip: 120000000, shipClass: 'Dreadnought', url: 'https://starwars.fandom.com/wiki/Providence-class_carrier/destroyer' },
      { id: 'cis018', name: 'Recusant-class light destroyer', costPerShip: 48000000, shipClass: 'Destroyer', url: 'https://starwars.fandom.com/wiki/Recusant-class_light_destroyer' },
      { id: 'cis019', name: 'Diamond-class cruiser', costPerShip: 28000000, shipClass: 'Cruiser', url: 'https://starwars.fandom.com/wiki/Diamond-class_cruiser' },
      { id: 'cis020', name: 'Munificent-class star frigate', costPerShip: 12000000, shipClass: 'Frigate', url: 'https://starwars.fandom.com/wiki/Munificent-class_star_frigate' },
      { id: 'cis021', name: 'Dual Hemisphere-Omni Support Vessel', costPerShip: 8500000, shipClass: 'Support vessel', url: 'https://starwars.fandom.com/wiki/Dual_Hemisphere-Omni_Support_Vessel' },
      { id: 'cis022', name: 'Umbaran support ship', costPerShip: 7500000, shipClass: 'Support ship', url: 'https://starwars.fandom.com/wiki/Umbaran_support_ship' },
      { id: 'cis023', name: 'C-9979 landing craft', costPerShip: 12000000, shipClass: 'Heavy transport', url: 'https://starwars.fandom.com/wiki/C-9979_landing_craft' },
      { id: 'cis024', name: 'Hardcell-class transport', costPerShip: 4500000, shipClass: 'Transport', url: 'https://starwars.fandom.com/wiki/Hardcell-class_transport' },
      { id: 'cis025', name: 'Trident-class assault ship', costPerShip: 3500000, shipClass: 'Assault ship', url: 'https://starwars.fandom.com/wiki/Trident-class_assault_ship' },
      { id: 'cis026', name: 'Gozanti-class cruiser', costPerShip: 200000, shipClass: 'Light cruiser / transport', url: 'https://starwars.fandom.com/wiki/Gozanti-class_cruiser' },
      { id: 'cis027', name: 'Sheathipede-class transport shuttle', costPerShip: 135000, shipClass: 'Shuttle', url: 'https://starwars.fandom.com/wiki/Sheathipede-class_transport_shuttle' },
      { id: 'cis028', name: 'Maxillipede shuttle', costPerShip: 120000, shipClass: 'Shuttle', url: 'https://starwars.fandom.com/wiki/Maxillipede_shuttle' },
      { id: 'cis029', name: 'Separatist drop ship', costPerShip: 250000, shipClass: 'Dropship', url: 'https://starwars.fandom.com/wiki/Separatist_drop_ship' },
      { id: 'cis030', name: 'Droch-class boarding ship', costPerShip: 43000, shipClass: 'Boarding craft', url: 'https://starwars.fandom.com/wiki/Droch-class_boarding_ship' },
      { id: 'cis031', name: 'B1 battle droid', costPerShip: 1800, shipClass: 'Droid infantry', url: 'https://starwars.fandom.com/wiki/B1_battle_droid' },
      { id: 'cis032', name: 'B2 super battle droid', costPerShip: 3000, shipClass: 'Droid infantry', url: 'https://starwars.fandom.com/wiki/B2_super_battle_droid' },
      { id: 'cis033', name: 'Droidekas', costPerShip: 11000, shipClass: 'Droid', url: 'https://starwars.fandom.com/wiki/Droideka' },
      { id: 'cis034', name: 'BX-series droid commando', costPerShip: 6500, shipClass: 'Droid commando', url: 'https://starwars.fandom.com/wiki/BX-series_droid_commando' },
      { id: 'cis035', name: 'AAT (Armored Assault Tank)', costPerShip: 75000, shipClass: 'Tank', url: 'https://starwars.fandom.com/wiki/Armored_Assault_Tank' },
      { id: 'cis036', name: 'MTT (Multi-Troop Transport)', costPerShip: 130000, shipClass: 'Transport', url: 'https://starwars.fandom.com/wiki/Multi-Troop_Transport' },
      { id: 'cis037', name: 'STAP (Single Trooper Aerial Platform)', costPerShip: 3000, shipClass: 'Speeder', url: 'https://starwars.fandom.com/wiki/Single_Trooper_Aerial_Platform' },
      { id: 'cis038', name: 'IG-227 Hailfire-class droid tank', costPerShip: 65000, shipClass: 'Droid tank', url: 'https://starwars.fandom.com/wiki/IG-227_Hailfire-class_droid_tank' },
    ],
    unitTypes: [
      { id: 'cis_u001', name: 'Vulture Droid Squadron', components: [
        { type: 'ship', refId: 'cis001', quantity: 12 },
      ] },
      { id: 'cis_u002', name: 'Tri-Fighter Squadron', components: [
        { type: 'ship', refId: 'cis002', quantity: 12 },
      ] },
      { id: 'cis_u003', name: 'Hyena Bomber Squadron', components: [
        { type: 'ship', refId: 'cis003', quantity: 12 },
      ] },
      { id: 'cis_u004', name: 'Nantex Squadron', components: [
        { type: 'ship', refId: 'cis005', quantity: 12 },
      ] },
      { id: 'cis_u005', name: 'Mixed Droid Fighter Wing', components: [
        { type: 'ship', refId: 'cis001', quantity: 36 },
        { type: 'ship', refId: 'cis002', quantity: 12 },
        { type: 'ship', refId: 'cis003', quantity: 12 },
      ] },
      { id: 'cis_u006', name: 'Munificent Battle Group', components: [
        { type: 'ship', refId: 'cis020', quantity: 1 },
        { type: 'unit', refId: 'cis_u001', quantity: 4 },
        { type: 'ship', refId: 'cis026', quantity: 2 },
      ] },
      { id: 'cis_u007', name: 'Recusant Task Force', components: [
        { type: 'ship', refId: 'cis018', quantity: 1 },
        { type: 'unit', refId: 'cis_u005', quantity: 1 },
        { type: 'ship', refId: 'cis020', quantity: 2 },
      ] },
      { id: 'cis_u008', name: 'Providence Task Force', components: [
        { type: 'ship', refId: 'cis017', quantity: 1 },
        { type: 'ship', refId: 'cis020', quantity: 2 },
        { type: 'unit', refId: 'cis_u005', quantity: 2 },
        { type: 'ship', refId: 'cis023', quantity: 4 },
      ] },
      { id: 'cis_u009', name: 'Lucrehulk Battle Group', components: [
        { type: 'ship', refId: 'cis015', quantity: 1 },
        { type: 'ship', refId: 'cis020', quantity: 4 },
        { type: 'unit', refId: 'cis_u005', quantity: 6 },
        { type: 'ship', refId: 'cis023', quantity: 8 },
      ] },
      { id: 'cis_u010', name: 'Battle Droid Legion', components: [
        { type: 'ship', refId: 'cis031', quantity: 10000 },
        { type: 'ship', refId: 'cis032', quantity: 1000 },
        { type: 'ship', refId: 'cis033', quantity: 100 },
        { type: 'ship', refId: 'cis034', quantity: 50 },
      ] },
      { id: 'cis_u011', name: 'Droid Armor Battalion', components: [
        { type: 'ship', refId: 'cis035', quantity: 50 },
        { type: 'ship', refId: 'cis036', quantity: 20 },
        { type: 'ship', refId: 'cis037', quantity: 100 },
        { type: 'ship', refId: 'cis038', quantity: 12 },
      ] },
      { id: 'cis_u012', name: 'Invasion Army', components: [
        { type: 'unit', refId: 'cis_u010', quantity: 3 },
        { type: 'unit', refId: 'cis_u011', quantity: 2 },
        { type: 'ship', refId: 'cis023', quantity: 15 },
        { type: 'ship', refId: 'cis004', quantity: 50 },
      ] },
      { id: 'cis_u013', name: 'Droid Squad', components: [
        { type: 'ship', refId: 'cis031', quantity: 8 },
      ] },
      { id: 'cis_u014', name: 'Droid Platoon', components: [
        { type: 'unit', refId: 'cis_u013', quantity: 7 },
      ] },
      { id: 'cis_u015', name: 'Droid Company', components: [
        { type: 'unit', refId: 'cis_u014', quantity: 2 },
        { type: 'ship', refId: 'cis032', quantity: 11 },
        { type: 'ship', refId: 'cis033', quantity: 2 },
        { type: 'ship', refId: 'cis034', quantity: 1 },
        { type: 'ship', refId: 'cis036', quantity: 1 },
      ] },
      { id: 'cis_u016', name: 'Droid Battalion', components: [
        { type: 'unit', refId: 'cis_u015', quantity: 7 },
        { type: 'ship', refId: 'cis035', quantity: 24 },
      ] },
      { id: 'cis_u017', name: 'Droid Vanguard', components: [
        { type: 'unit', refId: 'cis_u015', quantity: 11 },
        { type: 'ship', refId: 'cis035', quantity: 18 },
      ] },
      { id: 'cis_u018', name: 'Droid Regiment', components: [
        { type: 'unit', refId: 'cis_u016', quantity: 4 },
        { type: 'unit', refId: 'cis_u017', quantity: 1 },
        { type: 'ship', refId: 'cis023', quantity: 1 },
      ] },
      { id: 'cis_u019', name: 'Droid Division', components: [
        { type: 'unit', refId: 'cis_u018', quantity: 5 },
      ] },
      { id: 'cis_u020', name: 'Droid Corps', components: [
        { type: 'unit', refId: 'cis_u019', quantity: 5 },
      ] },
      { id: 'cis_u021', name: 'Droid Army', components: [
        { type: 'unit', refId: 'cis_u020', quantity: 2 },
      ] },
    ],
    fleets: [
      { id: 'cis_f001', name: 'CIS Sector Fleet', entries: [
        { id: 'cis_f001_e001', type: 'ship', refId: 'cis015', quantity: 1 },
        { id: 'cis_f001_e002', type: 'ship', refId: 'cis017', quantity: 4 },
        { id: 'cis_f001_e003', type: 'ship', refId: 'cis018', quantity: 8 },
        { id: 'cis_f001_e004', type: 'ship', refId: 'cis020', quantity: 16 },
        { id: 'cis_f001_e005', type: 'ship', refId: 'cis019', quantity: 4 },
        { id: 'cis_f001_e006', type: 'unit', refId: 'cis_u005', quantity: 20 },
        { id: 'cis_f001_e007', type: 'unit', refId: 'cis_u012', quantity: 2 },
        { id: 'cis_f001_e008', type: 'ship', refId: 'cis026', quantity: 30 },
      ] },
      { id: 'cis_f002', name: 'CIS Invasion Fleet', entries: [
        { id: 'cis_f002_e001', type: 'unit', refId: 'cis_u009', quantity: 2 },
        { id: 'cis_f002_e002', type: 'unit', refId: 'cis_u008', quantity: 6 },
        { id: 'cis_f002_e003', type: 'unit', refId: 'cis_u007', quantity: 8 },
        { id: 'cis_f002_e004', type: 'unit', refId: 'cis_u012', quantity: 5 },
        { id: 'cis_f002_e005', type: 'ship', refId: 'cis021', quantity: 2 },
      ] },
      { id: 'cis_f003', name: 'CIS Raid Fleet', entries: [
        { id: 'cis_f003_e001', type: 'ship', refId: 'cis018', quantity: 3 },
        { id: 'cis_f003_e002', type: 'ship', refId: 'cis020', quantity: 6 },
        { id: 'cis_f003_e003', type: 'unit', refId: 'cis_u005', quantity: 8 },
        { id: 'cis_f003_e004', type: 'ship', refId: 'cis030', quantity: 24 },
      ] },
    ],
  }
}
