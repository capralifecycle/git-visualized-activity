import React from "react"
import { Row } from "../types"

export const CommitList: React.FC<{ data: Row[] }> = ({ data }) => {
  const grouped = data.reduce<{
    [authorName: string]: {
      [owner: string]: {
        [repo: string]: Row[]
      }
    }
  }>((acc, row) => {
    const { owner, repo, authorName } = row
    acc[authorName] = acc[authorName] || {}
    acc[authorName][owner] = acc[authorName][owner] || {}
    acc[authorName][owner][repo] = acc[authorName][owner][repo] || []
    acc[authorName][owner][repo].push(row)
    return acc
  }, {})

  const normalizedAndSorted = Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([authorName, authorData]) => ({
      authorName,
      owners: Object.entries(authorData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([owner, ownerData]) => ({
          owner,
          repos: Object.entries(ownerData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([repo, commits]) => ({
              repo,
              commits,
            })),
        })),
    }))

  return (
    <>
      {normalizedAndSorted.map(({ authorName, owners }) => (
        <React.Fragment key={authorName}>
          <h3>{authorName}</h3>
          <ul>
            {owners.map(({ owner, repos }) =>
              repos.map(({ repo, commits }) =>
                commits.map((row) => (
                  <li key={row.commit}>
                    {owner} / {repo}:{" "}
                    <a
                      href={`https://github.com/${owner}/${repo}/commit/${row.commit}`}
                    >
                      {row.subject}
                    </a>{" "}
                    <span title="Lines added">+{row.linesInserted}</span>{" "}
                    <span title="Lines deleted">-{row.linesDeleted}</span>{" "}
                    <span title="Files changed">({row.filesChanged})</span>
                  </li>
                )),
              ),
            )}
          </ul>
        </React.Fragment>
      ))}
    </>
  )
}
