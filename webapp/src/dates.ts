import {
  add,
  endOfISOWeek,
  endOfMonth,
  format,
  startOfISOWeek,
  startOfMonth,
  subMonths,
} from "date-fns"
import { DefinedRange } from "materialui-daterange-picker"

interface DateRange {
  first: Date
  last: Date
}

function computeOverlap(
  bounds: DateRange,
  value: DateRange,
): DateRange | undefined {
  const thisFrom = bounds.first > value.first ? bounds.first : value.first
  const thisTo = bounds.last < value.last ? bounds.last : value.last

  if (thisFrom <= thisTo) {
    return { first: thisFrom, last: thisTo }
  } else {
    return undefined
  }
}

function definedRangeOf(label: string, range: DateRange): DefinedRange {
  return {
    startDate: range.first,
    endDate: range.last,
    label,
  }
}

export function createDefinedRanges(bounds: DateRange): DefinedRange[] {
  const result: DefinedRange[] = []
  const now = new Date()

  result.push(definedRangeOf("All time", bounds))

  const thisWeekRange = computeOverlap(bounds, {
    first: startOfISOWeek(now),
    last: endOfISOWeek(now),
  })
  if (thisWeekRange != null) {
    result.push(definedRangeOf("This week", thisWeekRange))
  }

  const lastWeekRange = computeOverlap(bounds, {
    first: add(startOfISOWeek(now), { days: -7 }),
    last: add(endOfISOWeek(now), { days: -7 }),
  })
  if (lastWeekRange != null) {
    result.push(definedRangeOf("Last week", lastWeekRange))
  }

  const thisMonthRange = computeOverlap(bounds, {
    first: startOfMonth(now),
    last: endOfMonth(now),
  })
  if (thisMonthRange != null) {
    result.push(definedRangeOf("This month", thisMonthRange))
  }

  const lastMonth = subMonths(startOfMonth(now), 1)
  const lastMonthRange = computeOverlap(bounds, {
    first: lastMonth,
    last: endOfMonth(lastMonth),
  })
  if (lastMonthRange != null) {
    result.push(definedRangeOf("Last month", lastMonthRange))
  }

  return result
}

function dateFormat(obj: Date) {
  return format(obj, "yyyy-MM-dd")
}

export function formatDateRange(from?: Date, to?: Date) {
  if (from != null && to != null)
    return `${dateFormat(from)} to ${dateFormat(to)}`
  if (to != null) return `To ${dateFormat(to)}`
  if (from != null) return `From ${dateFormat(from)}`
  return "All dates"
}
