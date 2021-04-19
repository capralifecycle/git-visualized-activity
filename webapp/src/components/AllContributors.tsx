import { Typography } from "@material-ui/core"
import React from "react"
import { Row } from "../types"
import { groupBy } from "../utils"

interface Props {
  data: Row[]
}

export const AllContributors: React.FC<Props> = ({ data }) => {
  const list = groupBy(data, (row) => row.authorName).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  return (
    <ul>
      {list.map((item, idx) => (
        <li key={idx}>
          <Typography variant="body2">
            {item.name} <span title="Commit count">({item.commitCount})</span>
          </Typography>
        </li>
      ))}
    </ul>
  )
}
