import { createStyles, Theme, withStyles } from "@material-ui/core"
import { createMuiTheme } from "@material-ui/core/styles"
import { makeStyles } from "@material-ui/styles"
import { App } from "./components/App"

export const useFilterStyles = makeStyles({
  formControl: {
    margin: 10, // theme.spacing,
    minWidth: 80,
  },
  input: {
    color: "inherit",
  },
})

export const styles = (theme: Theme) =>
  createStyles({
    layout: {
      width: "auto",
      marginLeft: theme.spacing(3),
      marginRight: theme.spacing(3),
      [theme.breakpoints.up(1100 + theme.spacing(3) * 2)]: {
        width: 1100,
        marginLeft: "auto",
        marginRight: "auto",
      },
    },
    dateRangePicker: {
      marginBottom: theme.spacing(1),
    },
  })

export const theme = createMuiTheme({
  direction: "ltr",
  palette: {
    type: "light",
  },
})

export const StyledApp = withStyles(styles)(App)
