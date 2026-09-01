export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDateForInput(iso: string): string {
  return iso.slice(0, 16); // YYYY-MM-DDTHH:mm for datetime-local
}
