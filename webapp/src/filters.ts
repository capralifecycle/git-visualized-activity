import { isBefore } from "date-fns"
import { AppState, Row } from "./types"
import { fullRepoId, isBot } from "./utils"

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

export function filterData(data: Row[], state: AppState): Row[] {
  const filters = [
    (data: Row[]) => {
      const filter = state.filterDateFrom
      return filter == null
        ? data
        : data.filter((it) => !isBefore(it.timestamp, filter))
    },
    (data: Row[]) => {
      const filter = state.filterDateUntil
      return filter == null
        ? data
        : data.filter((it) => isBefore(it.timestamp, filter))
    },
    buildFilter(state.filterAuthorName, (it) => it.authorName),
    buildFilter(state.filterProject, (it) => it.project),
    buildFilter(state.filterOwner, (it) => it.owner),
    buildFilter(state.filterRepo, fullRepoId),
    buildFilter(state.filterMerges, (it) => (it.isMerge ? "y" : "n")),
    buildFilter(state.filterBots, (it) => (isBot(it) ? "y" : "n")),
  ]

  return filters.reduce((acc, filter) => filter(acc), data)
}
