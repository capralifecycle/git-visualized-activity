import { Grid, Toolbar, Typography, WithStyles } from "@material-ui/core"
import AppBar from "@material-ui/core/AppBar"
import React, { ChangeEvent, useState } from "react"
import { buildFilter, parseValue } from "../filters"
import { styles } from "../styles"
import { AppState, Dataset } from "../types"
import { useData as useLoadData } from "../use-load-data"
import {
  filterByPeaks,
  fullRepoId,
  getAllYearMonthBetween,
  getUnique,
  getYearMonth,
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

export const App: React.FC<Props> = ({ classes }) => {
  const [state, setState] = useState<AppState>({
    filterYear: null,
    filterYearMonth: null,
    filterAuthorName: null,
    filterProject: null,
    filterOwner: null,
    filterRepo: null,
    filterMerges: null,
    filterBots: null,
  })

  const { data: data1, loading, error } = useLoadData()

  if (loading) {
    return <Typography variant="body1">Loading data!</Typography>
  } else if (error) {
    return <Typography variant="body1">Error: {error}</Typography>
  }

  if (data1 == null) {
    throw new Error("Expected data")
  }

  const data = data1

  const handleChange = <T extends keyof AppState>(field: T) => (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    setState({
      ...state,
      [field]: parseValue(e.target.value),
    })
  }

  function getFilteredData() {
    const filters = [
      buildFilter(state.filterYear, (it) =>
        it.timestamp.getFullYear().toString(),
      ),
      buildFilter(state.filterYearMonth, (it) => getYearMonth(it.timestamp)),
      buildFilter(state.filterAuthorName, (it) => it.authorName),
      buildFilter(state.filterProject, (it) => it.project),
      buildFilter(state.filterOwner, (it) => it.owner),
      buildFilter(state.filterRepo, fullRepoId),
      buildFilter(state.filterMerges, (it) => (it.isMerge ? "y" : "n")),
      buildFilter(state.filterBots, (it) => (isBot(it) ? "y" : "n")),
    ]

    return filters.reduce((acc, filter) => filter(acc), data)
  }

  const filteredData = getFilteredData()
  const yearMonths = getAllYearMonthBetween(filteredData)
  const filteredDataset: Dataset = {
    rows: filteredData,
    yearMonths,
  }

  return (
    <div className={classes.layout}>
      <AppBar>
        <Toolbar>
          <div className={classes.layout}>
            <Filter
              allValue="Year?"
              handleChange={handleChange}
              name="filterYear"
              value={state.filterYear}
              options={getUnique(data, (it) =>
                it.timestamp.getFullYear().toString(),
              )}
            />
            <Filter
              allValue="Year/month?"
              handleChange={handleChange}
              name="filterYearMonth"
              value={state.filterYearMonth}
              options={getUnique(data, (it) => getYearMonth(it.timestamp))}
            />
            <Filter
              allValue="Who?"
              handleChange={handleChange}
              name="filterAuthorName"
              value={state.filterAuthorName}
              options={getUnique(data, (it) => it.authorName)}
            />
            <Filter
              allValue="Project?"
              handleChange={handleChange}
              name="filterProject"
              value={state.filterProject}
              options={getUnique(data, (it) => it.project)}
            />
            <Filter
              allValue="GitHub org?"
              handleChange={handleChange}
              name="filterOwner"
              value={state.filterOwner}
              options={getUnique(data, (it) => it.owner)}
            />
            <Filter
              allValue="Repo?"
              handleChange={handleChange}
              name="filterRepo"
              value={state.filterRepo}
              options={getUnique(data, fullRepoId)}
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
