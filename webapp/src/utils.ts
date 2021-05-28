import { Dataset, Row, YearMonthPartition } from "./types"

export function yearMonthZeroBasis(yearMonths: string[]): {
  [yearMonth: string]: number
} {
  return yearMonths.reduce<{ [yearMonth: string]: number }>((acc, cur) => {
    acc[cur] = 0
    return acc
  }, {})
}

export function calculateMax<T>(data: T[], getter: (arg: T) => number) {
  const max = Math.max(...data.map(getter))
  return Math.ceil(max / 100) * 100
}

export function groupBy(data: Row[], groupGetter: (row: Row) => string) {
  return Object.entries(
    data.reduce<{ [key: string]: number }>((acc, row) => {
      const group = groupGetter(row)
      acc[group] = (acc[group] || 0) + 1
      return acc
    }, {}),
  ).map(([key, commitCount]) => ({
    name: key,
    commitCount,
  }))
}

export function groupByTop(data: Row[], groupGetter: (row: Row) => string) {
  return groupBy(data, groupGetter)
    .sort((a, b) => b.commitCount - a.commitCount)
    .slice(0, 15)
}

export function groupByYearMonth(
  dataset: Dataset,
  fieldOrGetter: "authorName" | "owner" | "project" | ((row: Row) => string),
) {
  const getter =
    typeof fieldOrGetter === "string"
      ? (row: Row) => row[fieldOrGetter]
      : fieldOrGetter

  return dataset.rows.reduce<YearMonthPartition>((acc, row) => {
    const partition = getter(row)
    const yearMonth = getYearMonth(row.timestamp)

    if (!acc[partition]) acc[partition] = yearMonthZeroBasis(dataset.yearMonths)
    acc[partition][yearMonth] = (acc[partition][yearMonth] || 0) + 1
    return acc
  }, {})
}

export function mapToYearMonthTop(
  data: YearMonthPartition,
  yearMonths: string[],
) {
  return yearMonths.map((yearMonth) => ({
    yearMonth,
    ...Object.entries(data).reduce<{ [partition: string]: number }>(
      (acc, [partition, cur]) => {
        acc[partition] = cur[yearMonth]
        return acc
      },
      {},
    ),
  }))
}

export function getYearMonth(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()

  return `${year}-${month}`
}

export function getAllYearMonthBetween(data: Row[]): string[] {
  let first: Date | null = null
  let last: Date | null = null

  for (const row of data) {
    if (first == null || row.timestamp < first) {
      first = row.timestamp
    }
    if (last == null || row.timestamp > last) {
      last = row.timestamp
    }
  }

  if (first == null || last == null) return []

  let cur = first
  const result: string[] = []

  while (true) {
    result.push(getYearMonth(cur))

    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    if (getYearMonth(cur) > getYearMonth(last)) break
  }

  return result
}

export function filterByPeaks(data: YearMonthPartition, top = 15) {
  const onlyShowPartitions = Object.entries(data)
    .map(([partition, cur]) => ({
      partition,
      max: Math.max(...Object.values(cur)),
    }))
    .sort((a, b) => b.max - a.max)
    .slice(0, top)
    .map((it) => it.partition)

  return Object.entries(data).reduce<YearMonthPartition>(
    (acc, [partition, cur]) => {
      if (onlyShowPartitions.includes(partition)) {
        acc[partition] = cur
      }
      return acc
    },
    {},
  )
}

export function getUnique(data: Row[], getter: (row: Row) => string) {
  return Object.keys(
    data.reduce<{ [val: string]: boolean }>((acc, cur) => {
      acc[getter(cur)] = true
      return acc
    }, {}),
  ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

export function fullRepoId(row: Row) {
  return `${row.owner}/${row.repo}`
}

export function isBot(row: Row) {
  if (row.authorName === undefined) {
    debugger
  }
  return row.authorName.substring(0, 4) === "bot:"
}

export function shortOwner(row: Row) {
  return row.owner === "capralifecycle"
    ? "cals"
    : row.owner === "cantara"
    ? "cantara"
    : row.owner === "capraconsulting"
    ? "capra"
    : row.owner
}

export function shortNameLabel(row: Row) {
  return row.owner === "capralifecycle"
    ? row.repo
    : `${shortOwner(row)} / ${row.repo}`
}
