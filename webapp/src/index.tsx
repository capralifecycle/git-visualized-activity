import CssBaseline from "@material-ui/core/CssBaseline"
import { MuiThemeProvider } from "@material-ui/core/styles"
import domready from "domready"
import React from "react"
import ReactDOM from "react-dom"
import { StyledApp, theme } from "./styles"

domready(() => {
  ReactDOM.render(
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <StyledApp />
    </MuiThemeProvider>,
    document.getElementById("container"),
  )
})
