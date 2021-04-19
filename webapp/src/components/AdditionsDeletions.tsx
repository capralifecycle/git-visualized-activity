import { green, red } from "@material-ui/core/colors"
import React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Dataset } from "../types"
import { getYearMonth, mapToYearMonthTop, yearMonthZeroBasis } from "../utils"

interface Props {
  dataset: Dataset
}

export const AdditionsDeletions: React.FC<Props> = ({ dataset }) => {
  const grouped = dataset.rows.reduce(
    (acc, row) => {
      const monthMonth = getYearMonth(row.timestamp)
      acc["additions"][monthMonth] += row.linesInserted
      acc["deletions"][monthMonth] -= row.linesDeleted
      return acc
    },
    {
      additions: yearMonthZeroBasis(dataset.yearMonths),
      deletions: yearMonthZeroBasis(dataset.yearMonths),
    },
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={mapToYearMonthTop(grouped, dataset.yearMonths)}>
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
        <Area
          type="linear"
          dataKey="additions"
          dot={{
            stroke: green[500],
            fill: green[500],
          }}
          stroke={green[500]}
          strokeWidth={1}
          fill={green[500]}
        />
        <Area
          type="linear"
          dataKey="deletions"
          dot={{
            stroke: red[500],
            fill: red[500],
          }}
          stroke={red[500]}
          strokeWidth={1}
          fill={red[500]}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
