import { Button } from "@material-ui/core"
import React from "react"
import { Row } from "../types"
import { CommitList } from "./CommitList"

export class LazyCommitList extends React.Component<{ data: Row[] }> {
  state: { show: boolean } = {
    show: false,
  }
  render() {
    return (
      <>
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.setState({ show: !this.state.show })}
        >
          {this.state.show ? "Hide" : "Show"}
        </Button>
        {this.state.show && <CommitList data={this.props.data} />}
      </>
    )
  }
}
