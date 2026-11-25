/** Minúsculas, sin acentos y sin espacios en los extremos. Para comparar textos. */
export const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** Primer grupo de dígitos del texto, o "" si no hay. */
export const extractDigits = (value: string): string => value.match(/\d+/)?.[0] ?? "";

/** true si el número tiene a lo más `decimals` decimales (sin redondear). */
export const hasAtMostDecimals = (value: number, decimals: number): boolean => {
  if (!Number.isFinite(value)) return false;
  const factor = 10 ** decimals;
  const scaled = value * factor;
  // Tolerancia para errores de punto flotante (p. ej. 0.1 + 0.2).
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
};

/**
 * Formatea un importe con `decimals` decimales y punto decimal.
 * Lanza un error si el importe no es finito o tiene más decimales de los
 * permitidos: el redondeo no está definido por Nóminas, así que no se aplica
 * en silencio.
 */
export const formatAmount = (value: number, decimals: number): string => {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Importe no numérico: ${value}`);
  }
  if (!hasAtMostDecimals(value, decimals)) {
    throw new RangeError(`Importe con más de ${decimals} decimales: ${value}`);
  }
  const factor = 10 ** decimals;
  return (Math.round(value * factor) / factor).toFixed(decimals);
};
