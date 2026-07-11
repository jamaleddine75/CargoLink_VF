export interface CityOption {
  value: string;
  label: string;
}

export const SUPPORTED_CITIES: CityOption[] = [
  { value: "FNIDEQ", label: "Fnideq" },
  { value: "TETOUAN", label: "Tetouan" },
  { value: "MDIQ", label: "Mdiq" },
  { value: "TANGER", label: "Tanger" },
  { value: "CHAOUEN", label: "Chaouen" }
];

export const SUPPORTED_CITY_NAMES = SUPPORTED_CITIES.map(c => c.label);
