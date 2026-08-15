export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTimeString(): string {
  return new Date().toTimeString().slice(0, 8);
}
