export interface Dataset {
  rows: Row[]
  yearMonths: string[]
}

export interface YearMonthPartition {
  [partition: string]: { [yearMonth: string]: number }
}

export interface MonthStats {
  [yearMonth: string]: {
    contributors: string[]
    repos: string[]
    projects: string[]
  }
}

export interface AppState {
  filterDateFrom: Date | undefined
  filterDateUntil: Date | undefined
  filterAuthorName: string | null
  filterProject: string | null
  filterOwner: string | null
  filterRepo: string | null
  filterMerges: "y" | "n" | null
  filterBots: "y" | "n" | null
}

export interface RawRow {
  owner: string
  repo: string
  project: string
  files_changed: string
  lines_inserted: string
  lines_deleted: string
  commit: string
  is_merge: "y" | "n"
  timestamp: string
  author_name: string
  subject: string
}

export interface Row {
  owner: string
  repo: string
  project: string
  filesChanged: number
  linesInserted: number
  linesDeleted: number
  commit: string
  isMerge: boolean
  timestamp: Date
  authorName: string
  subject: string
}
