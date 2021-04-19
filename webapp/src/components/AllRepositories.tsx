import { Typography } from "@material-ui/core"
import React from "react"
import { Row } from "../types"
import { fullRepoId, groupBy } from "../utils"

interface Props {
  data: Row[]
}

export const AllRepositories: React.FC<Props> = ({ data }) => {
  const list = groupBy(data, fullRepoId).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  return (
    <ul>
      {list.map((item, idx) => (
        <li key={idx}>
          <Typography variant="body2">
            <a href={`https://github.com/${item.name}`}>{item.name}</a>{" "}
            <span title="Commit count">({item.commitCount})</span>
          </Typography>
        </li>
      ))}
    </ul>
  )
}
