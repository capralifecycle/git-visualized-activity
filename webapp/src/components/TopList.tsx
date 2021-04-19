import React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getChartColor } from "../colors"
import { calculateMax } from "../utils"
import { LongTick } from "./LongTick"

interface Props {
  data: { name: string; commitCount: number }[]
  yWidth?: number
}

export const TopList: React.FC<Props> = ({ data, yWidth = 150 }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart layout="vertical" data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <YAxis
        dataKey="name"
        type="category"
        interval={0}
        width={yWidth}
        tick={LongTick}
      />
      <XAxis
        type="number"
        tickLine
        domain={[0, calculateMax(data, (it) => it.commitCount)]}
      />
      <Tooltip />
      <Bar dataKey="commitCount" fill={getChartColor(0)} />
    </BarChart>
  </ResponsiveContainer>
)
