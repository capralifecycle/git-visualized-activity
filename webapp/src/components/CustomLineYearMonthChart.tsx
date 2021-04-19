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
import { YearMonthPartition } from "../types"
import { mapToYearMonthTop } from "../utils"

export const CustomLineYearMonthChart = ({
  data,
  yearMonths,
}: {
  data: YearMonthPartition
  yearMonths: string[]
}) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={mapToYearMonthTop(data, yearMonths)}>
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
      {Object.keys(data).map((it, idx) => (
        <Line
          key={it}
          type="monotone"
          dataKey={it}
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
