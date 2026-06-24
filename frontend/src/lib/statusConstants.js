/**
 * Standard Order Statuses for CargoLink
 * Based on Technical Specifications Section 0.2 & 7.4
 */

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  ASSIGNED: 'ASSIGNED',
  PICKUP_READY: 'PICKUP_READY',
  ON_THE_WAY: 'ON_THE_WAY',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  ISSUE: 'ISSUE',
  CANCELLED: 'CANCELLED',
  REFUSED: 'REFUSED'
};

export const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]: {
    label: 'Pending',
    color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    dot: 'bg-zinc-500'
  },
  [ORDER_STATUS.VALIDATED]: {
    label: 'Validated',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    dot: 'bg-blue-500'
  },
  [ORDER_STATUS.ASSIGNED]: {
    label: 'Assigned',
    color: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    dot: 'bg-blue-600'
  },
  [ORDER_STATUS.PICKUP_READY]: {
    label: 'Pickup Ready',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    dot: 'bg-orange-500'
  },
  [ORDER_STATUS.ON_THE_WAY]: {
    label: 'On the Way',
    color: 'bg-primary/10 text-primary border-primary/20',
    dot: 'bg-primary'
  },
  [ORDER_STATUS.ARRIVED]: {
    label: 'Arrived',
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    dot: 'bg-indigo-500'
  },
  [ORDER_STATUS.DELIVERED]: {
    label: 'Delivered',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    dot: 'bg-green-500'
  },
  [ORDER_STATUS.ISSUE]: {
    label: 'Issue',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    dot: 'bg-red-500'
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-zinc-700/10 text-zinc-700 border-zinc-700/20',
    dot: 'bg-zinc-700'
  },
  [ORDER_STATUS.REFUSED]: {
    label: 'Refused',
    color: 'bg-zinc-900/10 text-zinc-900 border-zinc-900/20',
    dot: 'bg-zinc-900'
  }
};

// ── Moroccan Cities for Delivery Locations ──────────────────────────────────
export const MOROCCAN_CITIES = [
  'Casablanca',
  'Fez',
  'Tangier',
  'Marrakech',
  'Agadir',
  'Rabat',
  'Sale',
  'Meknes',
  'Oujda',
  'Kenitra',
  'Tetouan',
  'Safi',
  'El Jadida',
  'Nador',
  'Taza',
  'Azemmour',
  'Larache',
  'Chefchaouen',
  'Ifrane',
  'Khenifra',
  'Khemisset',
  'Ouarzazate',
  'Taroudant',
  'Tiznit',
  'Essaouira',
  'Taourirt',
  'Midelt',
  'Tinghir',
  'Errachidia',
  'Beni Mellal',
  'Boujdour',
  'Ben Guerir',
  'Kasba Tadla',
  'Sefrou',
  'Jerada',
  'Ksar El Kébir',
  'Souq Sebt Ouled Nemma',
  'Bir Lehlou',
  'Ahfir'
];

export const NORTH_MOROCCO_CITIES = [
  'Tangier',
  'Tanger',
  'Tetouan',
  'Tétouan',
  'Fnideq',
  'Mdiq',
  'Martil',
  'Asilah',
  'Larache',
  'Ksar El Kébir',
  'Chefchaouen',
  'Al Hoceima',
  'Nador',
  'Taza',
  'Ouezzane',
  'Oujda',
  'Taourirt',
  'Jerada',
  'Ahfir'
];
