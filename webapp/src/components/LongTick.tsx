import React from "react"
import { Text } from "recharts"

interface Props {
  x: number
  y: number
  payload: { value: string }
}

export const LongTick: React.FC<Props> = ({ x, y, payload }) => (
  <Text x={x} y={y} width={500} textAnchor="end" verticalAnchor="middle">
    {payload.value}
  </Text>
)
