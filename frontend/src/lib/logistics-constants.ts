export const REGION_CITIES = ['Tanger', 'Tetouan', 'Fnideq', 'Mdiq', 'Martil'];
export const REGION_CENTER: [number, number] = [35.7595, -5.8340];
export const REGION_BOUNDS: [[number, number], [number, number]] = [
  [35.4, -6.2],
  [36.2, -4.8]
];

export const CITY_COORDINATES: Record<string, [number, number]> = {
  tangier: [35.7595, -5.8340],
  tanger: [35.7595, -5.8340],
  tetouan: [35.5889, -5.3626],
  'tétouan': [35.5889, -5.3626],
  fnideq: [35.8493, -5.3570],
  mdiq: [35.6923, -5.3197],
  martil: [35.6166, -5.2753],
  asilah: [35.4652, -6.0340],
  larache: [35.1932, -6.1557],
  'ksar el kebir': [35.0000, -5.9000],
  chefchaouen: [35.1688, -5.2682],
  'al hoceima': [35.2517, -3.9372],
  nador: [35.1687, -2.9286],
  taza: [34.2166, -4.0088],
  ouezzane: [34.7972, -5.5719],
  oujda: [34.6814, -1.9086],
  taourirt: [34.4073, -2.8975],
  jerada: [34.3086, -2.1618],
  ahfir: [34.9537, -2.1008],
};

export const normalizeCityKey = (city: string) =>
  city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const getCityCoordinates = (city: string): [number, number] => 
  CITY_COORDINATES[normalizeCityKey(city)] || REGION_CENTER;

export const isWithinNorthernMorocco = (lat: number | null, lng: number | null) => {
  if (lat === null || lng === null) return false;
  return lat >= REGION_BOUNDS[0][0] && lat <= REGION_BOUNDS[1][0] && 
         lng >= REGION_BOUNDS[0][1] && lng <= REGION_BOUNDS[1][1];
};
