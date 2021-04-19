import { Row } from "./types"

export function buildFilter<T>(filterValue: T | null, getter: (row: Row) => T) {
  return (data: Row[]) => {
    if (filterValue === null) return data
    return data.filter((it) => getter(it) === filterValue)
  }
}

export function formatValue(value: string | null) {
  return value === null ? "" : value
}

export function parseValue(value: string) {
  return value === "" ? null : value
}
