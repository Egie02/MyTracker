/** Shared calendar period helpers — single source of truth for date-range filters. */
export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  return { from, to };
}

export function getCurrentMonthRange(): { from: string; to: string; year: number; month: number } {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const { from, to } = getMonthRange(year, month);
  return { from, to, year, month };
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' });
}
