const excludedProvinces = new Set(["Illes Balears", "Las Palmas", "Santa Cruz de Tenerife", "Ceuta", "Melilla"]);

export const MAINLAND_PROVINCES = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos",
  "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara",
  "Gipuzkoa", "Huelva", "Huesca", "Jaén", "La Rioja", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia",
  "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel",
  "Toledo", "Valencia", "Valladolid", "Bizkaia", "Zamora", "Zaragoza",
] as const;

export function isMainlandShippingAddress(province: string, postalCode: string): boolean {
  if (excludedProvinces.has(province)) return false;
  const prefix = Number(postalCode.slice(0, 2));
  return ![7, 35, 38, 51, 52].includes(prefix);
}