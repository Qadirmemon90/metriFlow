/**
 * Formats integer paisa into Pakistani Rupees string: "PKR 12,450.00"
 */
export function formatPaisa(paisa: number | string | bigint | undefined | null): string {
  if (paisa === undefined || paisa === null) return 'PKR 0.00';
  const num = typeof paisa === 'string' ? Number(paisa) : Number(paisa);
  const rupees = num / 100;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees).replace('PKR', 'PKR ');
}

/**
 * Converts Pakistani Rupees input into integer paisa
 */
export function rupeesToPaisa(rupees: number | string): number {
  const val = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

/**
 * Converts integer paisa into decimal Rupees for input fields
 */
export function paisaToRupees(paisa: number | string | bigint | undefined | null): number {
  if (!paisa) return 0;
  return Number(paisa) / 100;
}

/**
 * Formats UTC timestamp into readable Pakistani local date: "17 Oct 2026"
 */
export function formatDate(utcString?: string | Date): string {
  if (!utcString) return '—';
  const date = typeof utcString === 'string' ? new Date(utcString) : utcString;
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats UTC timestamp into date and time: "17 Oct 2026, 08:30 PM"
 */
export function formatDateTime(utcString?: string | Date): string {
  if (!utcString) return '—';
  const date = typeof utcString === 'string' ? new Date(utcString) : utcString;
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats quantity numbers
 */
export function formatQuantity(qty: number | string | undefined | null, uom?: string): string {
  if (qty === undefined || qty === null) return '0';
  const val = typeof qty === 'string' ? parseFloat(qty) : qty;
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
  }).format(val);
  return uom ? `${formatted} ${uom}` : formatted;
}
