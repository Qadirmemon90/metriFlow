/**
 * MetriFlow Financial Math Module
 * Rules:
 * - Currency is Pakistani Rupee (PKR).
 * - All monetary values stored and transmitted as integer Paisa (1 PKR = 100 Paisa).
 * - ZERO binary floating point arithmetic for financial postings.
 * - Quantities use explicit Decimal strings with HALF_UP rounding.
 */

export type PaisaString = string; // e.g. "15000" for PKR 150.00
export type DecimalQuantityString = string; // e.g. "10", "2.5"

/**
 * Converts PKR to Paisa BigInt (1 PKR = 100 Paisa)
 */
export function pkrToPaisa(pkr: number | string): bigint {
  const pkrStr = pkr.toString().trim();
  const parts = pkrStr.split('.');
  const whole = BigInt(parts[0] || '0') * 100n;
  if (!parts[1]) return whole;
  const dec = parts[1].padEnd(2, '0').slice(0, 2);
  const frac = BigInt(dec);
  return pkrStr.startsWith('-') ? whole - frac : whole + frac;
}

/**
 * Formats Paisa BigInt or string into a display string in PKR (e.g. "150.00")
 */
export function paisaToPkrString(paisa: bigint | string | number): string {
  const p = BigInt(paisa);
  const sign = p < 0n ? '-' : '';
  const abs = p < 0n ? -p : p;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${sign}${whole}.${frac}`;
}

/**
 * Multiplies an integer Paisa amount by a decimal quantity using HALF_UP rounding
 * e.g. multiplyPaisa(15000n, "2.5") -> 37500n
 */
export function multiplyPaisa(paisa: bigint, quantityStr: string): bigint {
  const qParts = quantityStr.trim().split('.');
  const wholeQ = BigInt(qParts[0] || '0');
  const fracStr = qParts[1] || '';
  const decimals = fracStr.length;
  
  if (decimals === 0) {
    return paisa * wholeQ;
  }
  
  const scale = 10n ** BigInt(decimals);
  const totalUnits = wholeQ * scale + BigInt(fracStr);
  const numerator = paisa * totalUnits;
  
  // HALF_UP integer division: add half of denominator before division
  const halfScale = scale / 2n;
  if (numerator >= 0n) {
    return (numerator + halfScale) / scale;
  } else {
    return (numerator - halfScale) / scale;
  }
}

/**
 * Validates that a string is a valid integer Paisa string
 */
export function isValidPaisa(str: string): boolean {
  return /^-?\d+$/.test(str.trim());
}
