import CssBaseline from "@material-ui/core/CssBaseline"
import { MuiThemeProvider } from "@material-ui/core/styles"
import domready from "domready"
import Papa from "papaparse"
import React from "react"
import ReactDOM from "react-dom"
import { dataPath } from "./constants"
import { StyledApp, theme } from "./styles"
import { RawRow, Row } from "./types"

// eslint-disable-next-line @typescript-eslint/no-misused-promises
domready(async () => {
  const data = await new Promise<Row[]>((resolve, reject) => {
    Papa.parse(dataPath, {
      download: true,
      // Enabling fastmode also ignores the quote character,
      // which we currently require as the input CSV is not properly
      // escaped, but only the last column can contain "multiple"
      // columns so it normally only means the subject line are
      // truncated in case it contains a comma.
      fastMode: true,
      header: true,
      skipEmptyLines: true,
      complete({ data }: { data: RawRow[] }) {
        resolve(
          data
            .map<Row>((it) => ({
              owner: it.owner,
              repo: it.repo,
              project: it.project,
              filesChanged: Number(it.files_changed),
              linesInserted: Number(it.lines_inserted),
              linesDeleted: Number(it.lines_deleted),
              commit: it.commit,
              isMerge: it.is_merge === "y",
              timestamp: new Date(it.timestamp),
              authorName: it.author_name,
              subject: it.subject,
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        )
      },
      error(err) {
        alert("Data loading failed")
        reject(err)
      },
    })
  })

  ReactDOM.render(
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <StyledApp data={data} />
    </MuiThemeProvider>,
    document.getElementById("container"),
  )
})
