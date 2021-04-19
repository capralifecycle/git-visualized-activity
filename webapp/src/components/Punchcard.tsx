import React from "react"
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Text,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"
import { getChartColor } from "../colors"
import { days } from "../constants"
import { Row } from "../types"

interface Props {
  data: Row[]
}

export const Punchcard: React.FC<Props> = ({ data }) => {
  const transformed = data.reduce<{
    [weekday: number]: { [hour: number]: number }
  }>((acc, row) => {
    const d = new Date(row.timestamp)
    const hour = d.getHours()
    const weekday = d.getDay() === 0 ? 7 : d.getDay()

    acc[weekday] = acc[weekday] || {}
    acc[weekday][hour] = (acc[weekday][hour] || 0) + 1
    return acc
  }, {})

  const flattened = Object.entries(transformed).reduce<
    { weekday: number; hour: number; count: number }[]
  >((acc, [weekday, hourData]) => {
    Object.entries(hourData).forEach(([hour, count]) => {
      acc.push({
        weekday: Number(weekday),
        hour: Number(hour),
        count,
      })
    })
    return acc
  }, [])

  const plotData = flattened.map((item) => ({
    x: item.hour,
    y: item.weekday,
    z: item.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="hour"
          interval={0}
          domain={[0, 10]}
          ticks={new Array(25).fill(null).map((_, idx) => -0.5 + idx)}
          padding={{ left: 20, right: 20 }}
          tickFormatter={(val: number) => val + 0.5}
        />
        <YAxis
          allowDecimals={false}
          domain={[1, 7]}
          padding={{
            top: 20,
            bottom: 20,
          }}
          tickCount={7}
          dataKey="y"
          name="weekday"
          tick={({ x, y, payload }) => (
            <Text
              x={x}
              y={y}
              width={300}
              textAnchor="end"
              verticalAnchor="middle"
            >
              {days[payload.value - 1]}
            </Text>
          )}
          width={80}
        />
        <ZAxis
          dataKey="z"
          type="number"
          range={[0, 700]}
          scale="linear"
          name="commitCount"
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={(props: any) => {
            if (props.payload.length === 0) return null
            const {
              x,
              y,
              z,
            }: { x: number; y: number; z: number } = props.payload[0].payload
            return (
              <div
                style={{
                  background: "white",
                }}
              >
                {days[y - 1]}s at {x}-{x + 1}: Total {z} commits
              </div>
            )
          }}
        />
        <Scatter name="Commit count" data={plotData} fill={getChartColor(0)} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
