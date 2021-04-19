import React from "react"
import { Text } from "recharts"

export const LongTick = ({
  x,
  y,
  payload,
}: {
  x: number
  y: number
  payload: { value: string }
}) => (
  <Text x={x} y={y} width={500} textAnchor="end" verticalAnchor="middle">
    {payload.value}
  </Text>
)
