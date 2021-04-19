import React from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getChartColor } from "../colors"
import { Dataset, MonthStats } from "../types"
import { fullRepoId, getYearMonth } from "../utils"

export const OverallMonthly = ({ dataset }: { dataset: Dataset }) => {
  const initial = dataset.yearMonths.reduce<MonthStats>((acc, cur) => {
    acc[cur] = {
      contributors: [],
      repos: [],
      projects: [],
    }
    return acc
  }, {})

  const grouped = dataset.rows.reduce<MonthStats>((acc, row) => {
    const yearMonth = getYearMonth(row.timestamp)

    if (!acc[yearMonth].contributors.includes(row.authorName)) {
      acc[yearMonth].contributors.push(row.authorName)
    }

    const repo = fullRepoId(row)
    if (!acc[yearMonth].repos.includes(repo)) {
      acc[yearMonth].repos.push(repo)
    }

    if (!acc[yearMonth].projects.includes(row.project)) {
      acc[yearMonth].projects.push(row.project)
    }

    return acc
  }, initial)

  const normalized = Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([yearMonth, cur]) => ({
      yearMonth: yearMonth,
      contributors: cur.contributors.length,
      repos: cur.repos.length,
      projects: cur.projects.length,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={normalized}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis />
        <XAxis
          dataKey="yearMonth"
          type="category"
          interval={0}
          tickLine
          padding={{ left: 20, right: 20 }}
        />
        <Tooltip />
        <Legend />
        {["contributors", "repos", "projects"].map((val, idx) => (
          <Line
            key={val}
            type="monotone"
            dataKey={val}
            dot={{
              stroke: getChartColor(idx),
              fill: getChartColor(idx),
            }}
            stroke={getChartColor(idx)}
            strokeWidth={1}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
