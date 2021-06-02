import {
  Button,
  FormControl,
  Grid,
  Toolbar,
  Typography,
  WithStyles,
} from "@material-ui/core"
import AppBar from "@material-ui/core/AppBar"
import { add } from "date-fns"
import { max, min } from "lodash"
import { DateRangePicker, DefinedRange } from "materialui-daterange-picker"
import React, { ChangeEvent, useMemo, useState } from "react"
import { createDefinedRanges, formatDateRange } from "../dates"
import { filterDataNotByDate, filterDataOnlyDate, parseValue } from "../filters"
import { styles, useFilterStyles } from "../styles"
import { AppState, Dataset, Row } from "../types"
import { useData as useLoadData } from "../use-load-data"
import {
  filterByPeaks,
  fullRepoId,
  getAllYearMonthBetween,
  getUnique,
  groupByTop,
  groupByYearMonth,
  isBot,
  shortNameLabel,
} from "../utils"
import { AdditionsDeletions } from "./AdditionsDeletions"
import { AllContributors } from "./AllContributors"
import { AllRepositories } from "./AllRepositories"
import { CustomLineYearMonthChart } from "./CustomLineYearMonthChart"
import { Filter } from "./Filter"
import { LazyCommitList } from "./LazyCommitList"
import { OverallMonthly } from "./OverallMonthly"
import { Punchcard } from "./Punchcard"
import { TopList } from "./TopList"

type Props = WithStyles<typeof styles>
type PropsWithData = Props & { data: Row[] }

export const App: React.FC<Props> = ({ classes }) => {
  const { data, loading, error } = useLoadData()

  if (loading) {
    return <Typography variant="body1">Loading data!</Typography>
  } else if (error) {
    return <Typography variant="body1">Error: {error}</Typography>
  }

  if (data == null) {
    throw new Error("Expected data")
  }

  return <AppWithData classes={classes} data={data} />
}

const AppWithData: React.FC<PropsWithData> = ({ classes, data }) => {
  const [state, setState] = useState<AppState>({
    filterDateFrom: undefined,
    filterDateUntil: undefined,
    filterAuthorName: null,
    filterProject: null,
    filterOwner: null,
    filterRepo: null,
    filterMerges: null,
    filterBots: null,
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const filterStyles = useFilterStyles()

  const handleChange =
    <T extends keyof AppState>(field: T) =>
    (e: ChangeEvent<HTMLSelectElement>) => {
      setState({
        ...state,
        [field]: parseValue(e.target.value),
      })
    }

  const filteredDataNoDate = useMemo(
    () => filterDataNotByDate(data, state),
    [state, data],
  )
  const filteredData = useMemo(
    () => filterDataOnlyDate(filteredDataNoDate, state),
    [state, filteredDataNoDate],
  )

  const yearMonths = getAllYearMonthBetween(filteredData)
  const filteredDataset: Dataset = {
    rows: filteredData,
    yearMonths,
  }

  // When determining date ranges, use the data not already filtered
  // by dates. This is needed so that we can expand the date range
  // after selecting a specific range.
  const [firstDate, lastDate] = useMemo(() => {
    const timestamps = filteredDataNoDate.map((it) => it.timestamp)
    return [min(timestamps), max(timestamps)]
  }, [filteredDataNoDate])

  const definedRanges = useMemo<DefinedRange[]>(
    () =>
      firstDate != null && lastDate != null
        ? createDefinedRanges({
            first: firstDate,
            last: lastDate,
          })
        : [],
    [firstDate, lastDate],
  )

  return (
    <div className={classes.layout}>
      <AppBar>
        <Toolbar>
          <div className={classes.layout}>
            <FormControl className={filterStyles.formControl}>
              <Button
                className={filterStyles.input}
                onClick={() => setShowDatePicker(true)}
              >
                {state.filterDateFrom == null && state.filterDateUntil == null
                  ? formatDateRange(firstDate, lastDate)
                  : formatDateRange(
                      state.filterDateFrom,
                      state.filterDateUntil
                        ? add(state.filterDateUntil, { days: -1 })
                        : undefined,
                    )}
              </Button>
            </FormControl>
            <Filter
              allValue="Who?"
              handleChange={handleChange}
              name="filterAuthorName"
              value={state.filterAuthorName}
              options={getUnique(filteredData, (it) => it.authorName)}
            />
            <Filter
              allValue="Project?"
              handleChange={handleChange}
              name="filterProject"
              value={state.filterProject}
              options={getUnique(filteredData, (it) => it.project)}
            />
            <Filter
              allValue="GitHub org?"
              handleChange={handleChange}
              name="filterOwner"
              value={state.filterOwner}
              options={getUnique(filteredData, (it) => it.owner)}
            />
            <Filter
              allValue="Repo?"
              handleChange={handleChange}
              name="filterRepo"
              value={state.filterRepo}
              options={getUnique(filteredData, fullRepoId)}
            />
            <Filter
              allValue="Include merges"
              handleChange={handleChange}
              name="filterMerges"
              value={state.filterMerges}
              options={[
                { value: "y", label: "Show only merges" },
                { value: "n", label: "Exclude merges" },
              ]}
            />
            <Filter
              allValue="Include bots"
              handleChange={handleChange}
              name="filterBots"
              value={state.filterBots}
              options={[
                { value: "y", label: "Show only bots" },
                { value: "n", label: "Exclude bots" },
              ]}
            />
          </div>
        </Toolbar>
        {showDatePicker && (
          <>
            <div className={classes.layout}>
              <div className={classes.dateRangePicker}>
                <DateRangePicker
                  open={showDatePicker}
                  minDate={firstDate}
                  maxDate={lastDate}
                  toggle={() => void setShowDatePicker(false)}
                  onChange={(value) => {
                    const isAll =
                      value.startDate != null &&
                      value.endDate != null &&
                      value.startDate.getTime() == firstDate?.getTime() &&
                      value.endDate.getTime() == lastDate?.getTime()

                    setState({
                      ...state,
                      filterDateFrom: isAll ? undefined : value.startDate,
                      filterDateUntil: isAll
                        ? undefined
                        : value.endDate
                        ? add(value.endDate, { days: 1 })
                        : undefined,
                    })
                  }}
                  initialDateRange={{
                    startDate: state.filterDateFrom ?? undefined,
                    endDate: state.filterDateUntil
                      ? add(state.filterDateUntil, { days: -1 })
                      : undefined,
                  }}
                  definedRanges={definedRanges}
                />
              </div>
            </div>
          </>
        )}
      </AppBar>
      <div
        style={{
          marginTop: "80px",
        }}
      />
      <Typography component="h1" variant="h3">
        Git commit activity
      </Typography>
      <dl>
        <dt>Total commits</dt>
        <dd>
          {filteredData.length} (
          {filteredData.filter((row) => !isBot(row) && !row.isMerge).length}{" "}
          normal +{" "}
          {filteredData.filter((row) => !isBot(row) && row.isMerge).length}{" "}
          merges + {filteredData.filter(isBot).length} by bots)
        </dd>
        <dt>Number of contributors</dt>
        <dd>{getUnique(filteredData, (it) => it.authorName).length}</dd>
        <dt>Repositories contributed to</dt>
        <dd>{getUnique(filteredData, fullRepoId).length}</dd>
      </dl>
      <Grid container>
        <Grid item xs={12} md={4}>
          <Typography component="h2" variant="h4">
            Top projects
          </Typography>
          <TopList data={groupByTop(filteredData, (row) => row.project)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography component="h2" variant="h4">
            Top contributors
          </Typography>
          <TopList data={groupByTop(filteredData, (row) => row.authorName)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography component="h2" variant="h4">
            Most active repos
          </Typography>
          <TopList
            data={groupByTop(filteredData, (row) => shortNameLabel(row))}
            yWidth={250}
          />
        </Grid>
      </Grid>
      <Typography component="h2" variant="h4">
        Punchcard
      </Typography>
      <Typography variant="body1" gutterBottom>
        <i>Commit timestamps are shown in your browser&apos;s timezone.</i>
      </Typography>
      <Punchcard data={filteredData} />
      <Typography component="h2" variant="h4">
        Monthly activity
      </Typography>
      <OverallMonthly dataset={filteredDataset} />
      <Typography component="h2" variant="h4">
        Monthly number of commits
      </Typography>
      <CustomLineYearMonthChart
        data={groupByYearMonth(filteredDataset, () => "No group")}
        yearMonths={yearMonths}
      />
      <Typography component="h2" variant="h4">
        Monthly number of commits per GitHub org
      </Typography>
      <CustomLineYearMonthChart
        data={groupByYearMonth(filteredDataset, "owner")}
        yearMonths={yearMonths}
      />
      <Typography component="h2" variant="h4">
        Monthly number of commits per project
      </Typography>
      <CustomLineYearMonthChart
        data={filterByPeaks(groupByYearMonth(filteredDataset, "project"))}
        yearMonths={yearMonths}
      />
      <Typography component="h2" variant="h4">
        Monthly number of commits per author (top 15)
      </Typography>
      <CustomLineYearMonthChart
        data={filterByPeaks(groupByYearMonth(filteredDataset, "authorName"))}
        yearMonths={yearMonths}
      />
      <Typography component="h2" variant="h4">
        Monthly number of commits per repo (top 15)
      </Typography>
      <CustomLineYearMonthChart
        data={filterByPeaks(groupByYearMonth(filteredDataset, fullRepoId))}
        yearMonths={yearMonths}
      />
      <Typography component="h2" variant="h4">
        Additions and deletions
      </Typography>
      <AdditionsDeletions dataset={filteredDataset} />
      <Grid container>
        <Grid item xs={12} md={6}>
          <Typography component="h2" variant="h4">
            Full contributors list
          </Typography>
          <AllContributors data={filteredData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography component="h2" variant="h4">
            Full repository list
          </Typography>
          <AllRepositories data={filteredData} />
        </Grid>
      </Grid>
      <Typography component="h2" variant="h4" gutterBottom>
        All commits
      </Typography>
      <LazyCommitList data={filteredData} />
    </div>
  )
}
