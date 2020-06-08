export function removeLeadingSlash(value: string): string {
  return value.slice(0, 1) == "/" ? value.slice(1) : value
}
