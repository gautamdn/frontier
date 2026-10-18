/** Completed whole years from an ISO birthdate (yyyy-mm-dd) to `now`. */
export function ageInYears(birthdate: string, now: Date): number {
  const born = new Date(birthdate)
  // UTC throughout: ISO date strings parse as UTC, and age is year-granular,
  // so this stays deterministic regardless of the device timezone.
  let age = now.getUTCFullYear() - born.getUTCFullYear()
  const monthDelta = now.getUTCMonth() - born.getUTCMonth()
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getUTCDate() < born.getUTCDate())
  ) {
    age--
  }
  return age
}
