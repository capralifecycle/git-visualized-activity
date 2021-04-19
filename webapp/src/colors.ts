import { chartColors } from "./constants"

export function getChartColor(i: number) {
  return chartColors[i % chartColors.length]
}
