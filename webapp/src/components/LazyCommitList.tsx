import { Button } from "@material-ui/core"
import React, { useState } from "react"
import { Row } from "../types"
import { CommitList } from "./CommitList"

interface Props {
  data: Row[]
}

export const LazyCommitList: React.FC<Props> = ({ data }) => {
  const [show, setShow] = useState(false)

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setShow(!show)}
      >
        {show ? "Hide" : "Show"}
      </Button>
      {show && <CommitList data={data} />}
    </>
  )
}
