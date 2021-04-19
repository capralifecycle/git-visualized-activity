import Papa from "papaparse"
import { useEffect, useState } from "react"
import { dataPath } from "./constants"
import { RawRow, Row } from "./types"

async function loadData() {
  return new Promise<Row[]>((resolve, reject) => {
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
        reject(err)
      },
    })
  })
}

interface UseDataResponse {
  data: Row[] | null
  loading: boolean
  error: Error | null
}

export function useData(): UseDataResponse {
  const [data, setData] = useState<Row[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const result = await loadData()
        setData(result)
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { data, loading, error }
}
