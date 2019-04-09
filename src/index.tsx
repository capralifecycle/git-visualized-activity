import {
  Button,
  createStyles,
  FormControl,
  Grid,
  Input,
  MenuItem,
  Select,
  Theme,
  Toolbar,
  Typography,
  withStyles,
  WithStyles,
} from '@material-ui/core'
import AppBar from '@material-ui/core/AppBar'
import { green, red } from '@material-ui/core/colors'
import CssBaseline from '@material-ui/core/CssBaseline'
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles'
import { makeStyles } from '@material-ui/styles'
import domready from 'domready'
import Papa from 'papaparse'
import React, { ChangeEvent } from 'react'
import ReactDOM from 'react-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Text,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
// @ts-ignore
import dataPath from '../commits.csv'

const chartColors = [
  '#e6194b',
  '#3cb44b',
  // "#ffe119",
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#46f0f0',
  '#f032e6',
  '#bcf60c',
  '#fabebe',
  '#008080',
  '#e6beff',
  '#9a6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#000075',
  '#808080',
  '#ffffff',
  '#000000',
]

function getChartColor(i: number) {
  return chartColors[i % chartColors.length]
}

const monthBasis = new Array(12)
  .fill(null)
  .reduce<{ [month: number]: number }>((acc, _, idx) => {
    acc[idx] = 0
    return acc
  }, {})

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function calculateMax<T>(data: T[], getter: (arg: T) => number) {
  const max = Math.max(...data.map(getter))
  return Math.ceil(max / 100) * 100
}

const LongTick = ({
  x,
  y,
  payload,
}: {
  x: number
  y: number
  payload: { value: string }
}) => (
  <Text x={x} y={y} width={500} textAnchor='end' verticalAnchor='middle'>
    {payload.value}
  </Text>
)

function groupBy(data: Row[], groupGetter: (row: Row) => string) {
  return Object.entries(
    data.reduce<{ [key: string]: number }>((acc, row) => {
      const group = groupGetter(row)
      acc[group] = (acc[group] || 0) + 1
      return acc
    }, {}),
  ).map(([key, commitCount]) => ({
    name: key,
    commitCount,
  }))
}

function groupByTop(data: Row[], groupGetter: (row: Row) => string) {
  return groupBy(data, groupGetter)
    .sort((a, b) => b.commitCount - a.commitCount)
    .slice(0, 15)
}

const TopList = ({
  data,
  yWidth = 150,
}: {
  data: { name: string; commitCount: number }[]
  yWidth?: number
}) => (
  <ResponsiveContainer width='100%' height={300}>
    <BarChart layout='vertical' data={data}>
      <CartesianGrid strokeDasharray='3 3' />
      <YAxis
        dataKey='name'
        type='category'
        interval={0}
        width={yWidth}
        tick={LongTick}
      />
      <XAxis
        type='number'
        tickLine
        domain={[0, calculateMax(data, it => it.commitCount)]}
      />
      <Tooltip />
      <Bar dataKey='commitCount' fill={getChartColor(0)} />
    </BarChart>
  </ResponsiveContainer>
)

const Punchcard = ({ data }: { data: Row[] }) => {
  const transformed = data.reduce<{
    [weekday: number]: { [hour: number]: number }
  }>((acc, row) => {
    const d = new Date(row.timestamp)
    const hour = d.getHours()
    const weekday = d.getDay() === 0 ? 7 : d.getDay()

    acc[weekday] = acc[weekday] || {}
    acc[weekday][hour] = (acc[weekday][hour] || 0) + 1
    return acc
  }, {})

  const flattened = Object.entries(transformed).reduce<
    { weekday: number; hour: number; count: number }[]
  >((acc, [weekday, hourData]) => {
    Object.entries(hourData).forEach(([hour, count]) => {
      acc.push({
        weekday: Number(weekday),
        hour: Number(hour),
        count,
      })
    })
    return acc
  }, [])

  const max = flattened.reduce(
    (max, { count }) => (max > count ? max : count),
    0,
  )

  const plotData = flattened.map(item => ({
    x: item.hour,
    y: item.weekday,
    z: item.count,
  }))

  return (
    <ResponsiveContainer width='100%' height={300}>
      <ScatterChart>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          type='number'
          dataKey='x'
          name='hour'
          interval={0}
          domain={[0, 10]}
          ticks={new Array(25).fill(null).map((_, idx) => -0.5 + idx)}
          padding={{ left: 20, right: 20 }}
          tickFormatter={val => val + 0.5}
        />
        <YAxis
          allowDecimals={false}
          domain={[1, 7]}
          padding={{
            top: 20,
            bottom: 20,
          }}
          tickCount={7}
          dataKey='y'
          name='weekday'
          tick={({ x, y, payload }) => (
            <Text
              x={x}
              y={y}
              width={300}
              textAnchor='end'
              verticalAnchor='middle'
            >
              {days[payload.value - 1]}
            </Text>
          )}
          width={80}
        />
        <ZAxis
          dataKey='z'
          type='number'
          range={[0, 700]}
          scale='linear'
          name='commitCount'
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={(props: any) => {
            if (props.payload.length === 0) return null
            const {
              x,
              y,
              z,
            }: { x: number; y: number; z: number } = props.payload[0].payload
            return (
              <div
                style={{
                  background: 'white',
                }}
              >
                {days[y - 1]}s at {x}-{x + 1}: Total {z} commits
              </div>
            )
          }}
        />
        <Scatter name='Commit count' data={plotData} fill={getChartColor(0)} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

interface MonthPartition {
  [partition: string]: { [month: number]: number }
}

function groupByMonth(
  data: Row[],
  fieldOrGetter: 'authorName' | 'owner' | 'project' | ((row: Row) => string),
) {
  const getter =
    typeof fieldOrGetter === 'string'
      ? (row: Row) => row[fieldOrGetter]
      : fieldOrGetter

  return data.reduce<MonthPartition>((acc, row) => {
    const partition = getter(row)
    const month = new Date(row['timestamp']).getMonth()

    if (!acc[partition]) acc[partition] = { ...monthBasis }
    acc[partition][month] = (acc[partition][month] || 0) + 1
    return acc
  }, {})
}

function mapToMonthTop(data: MonthPartition) {
  return months.map((month, idx) => ({
    month,
    ...Object.entries(data).reduce<{ [partition: string]: number }>(
      (acc, [partition, cur]) => {
        acc[partition] = cur[idx]
        return acc
      },
      {},
    ),
  }))
}

const OverallMonthly = ({ data }: { data: Row[] }) => {
  interface MonthStats {
    [month: number]: {
      contributors: string[]
      commits: number
      repos: string[]
      projects: string[]
    }
  }

  const initial = months.reduce<MonthStats>((acc, _, idx) => {
    acc[idx] = {
      contributors: [],
      repos: [],
      commits: 0,
      projects: [],
    }
    return acc
  }, {})

  const grouped = data.reduce<MonthStats>((acc, row) => {
    const month = row.timestamp.getMonth()

    if (!acc[month].contributors.includes(row.authorName)) {
      acc[month].contributors.push(row.authorName)
    }

    const repo = fullRepoId(row)
    if (!acc[month].repos.includes(repo)) {
      acc[month].repos.push(repo)
    }

    if (!acc[month].projects.includes(row.project)) {
      acc[month].projects.push(row.project)
    }

    acc[month].commits++
    return acc
  }, initial)

  const normalized = Object.entries(grouped)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([month, cur]) => ({
      month: months[Number(month)],
      contributors: cur.contributors.length,
      commits: cur.commits,
      repos: cur.repos.length,
      projects: cur.projects.length,
    }))

  return (
    <ResponsiveContainer width='100%' height={300}>
      <LineChart data={normalized}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          dataKey='month'
          type='category'
          interval={0}
          tickLine
          padding={{ left: 20, right: 20 }}
        />
        <Tooltip />
        <Legend />
        {['commits', 'contributors', 'repos', 'projects'].map((val, idx) => (
          <Line
            key={val}
            type='monotone'
            yAxisId={val}
            dataKey={val}
            dot={{
              stroke: getChartColor(idx),
              fill: getChartColor(idx),
            }}
            stroke={getChartColor(idx)}
            strokeWidth={1}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

const CustomLineMonthChart = ({ data }: { data: MonthPartition }) => (
  <ResponsiveContainer width='100%' height={300}>
    <LineChart data={mapToMonthTop(data)}>
      <CartesianGrid strokeDasharray='3 3' />
      <YAxis />
      <XAxis
        dataKey='month'
        type='category'
        interval={0}
        tickLine
        padding={{ left: 20, right: 20 }}
      />
      <Tooltip />
      <Legend />
      {Object.keys(data).map((it, idx) => (
        <Line
          key={it}
          type='monotone'
          dataKey={it}
          dot={{
            stroke: getChartColor(idx),
            fill: getChartColor(idx),
          }}
          stroke={getChartColor(idx)}
          strokeWidth={1}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
)

const AdditionsDeletions = ({ data }: { data: Row[] }) => {
  const grouped = data.reduce(
    (acc, row) => {
      const month = new Date(row['timestamp']).getMonth()
      acc['additions'][month] += row.linesInserted
      acc['deletions'][month] -= row.linesDeleted
      return acc
    },
    {
      additions: { ...monthBasis },
      deletions: { ...monthBasis },
    },
  )

  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={mapToMonthTop(grouped)}>
        <CartesianGrid strokeDasharray='3 3' />
        <YAxis />
        <XAxis
          dataKey='month'
          type='category'
          interval={0}
          tickLine
          padding={{ left: 20, right: 20 }}
        />
        <Tooltip />
        <Legend />
        <Area
          type='linear'
          dataKey='additions'
          dot={{
            stroke: green[500],
            fill: green[500],
          }}
          stroke={green[500]}
          strokeWidth={1}
          fill={green[500]}
        />
        <Area
          type='linear'
          dataKey='deletions'
          dot={{
            stroke: red[500],
            fill: red[500],
          }}
          stroke={red[500]}
          strokeWidth={1}
          fill={red[500]}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function filterByPeaks(data: MonthPartition, top = 15) {
  const onlyShowPartitions = Object.entries(data)
    .map(([partition, cur]) => ({
      partition,
      max: Math.max(...Object.values(cur)),
    }))
    .sort((a, b) => b.max - a.max)
    .slice(0, top)
    .map(it => it.partition)

  return Object.entries(data).reduce<MonthPartition>(
    (acc, [partition, cur]) => {
      if (onlyShowPartitions.includes(partition)) {
        acc[partition] = cur
      }
      return acc
    },
    {},
  )
}

const AllContributors = ({ data }: { data: Row[] }) => {
  const list = groupBy(data, row => row.authorName).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  return (
    <ul>
      {list.map(item => (
        <li>
          <Typography variant='body2'>
            {item.name} <span title='Commit count'>({item.commitCount})</span>
          </Typography>
        </li>
      ))}
    </ul>
  )
}

const AllRepositories = ({ data }: { data: Row[] }) => {
  const list = groupBy(data, fullRepoId).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  return (
    <ul>
      {list.map(item => (
        <li>
          <Typography variant='body2'>
            <a href={`https://github.com/${item.name}`}>{item.name}</a>{' '}
            <span title='Commit count'>({item.commitCount})</span>
          </Typography>
        </li>
      ))}
    </ul>
  )
}

class LazyCommitList extends React.Component<{ data: Row[] }> {
  state: { show: boolean } = {
    show: false,
  }
  render() {
    return (
      <>
        <Button
          variant='contained'
          color='primary'
          onClick={e => this.setState({ show: !this.state.show })}
        >
          {this.state.show ? 'Hide' : 'Show'}
        </Button>
        {this.state.show && <CommitList data={this.props.data} />}
      </>
    )
  }
}

const CommitList = ({ data }: { data: Row[] }) => {
  const grouped = data.reduce<{
    [authorName: string]: {
      [owner: string]: {
        [repo: string]: Row[]
      }
    }
  }>((acc, row) => {
    const { owner, repo, authorName, commit, subject } = row
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
                commits.map(row => (
                  <li key={row.commit}>
                    {owner} / {repo}:{' '}
                    <a
                      href={`https://github.com/${owner}/${repo}/commit/${
                        row.commit
                      }`}
                    >
                      {row.subject}
                    </a>{' '}
                    <span title='Lines added'>+{row.linesInserted}</span>{' '}
                    <span title='Lines deleted'>-{row.linesDeleted}</span>{' '}
                    <span title='Files changed'>({row.filesChanged})</span>
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

function buildFilter<T>(filterValue: T | null, getter: (row: Row) => T) {
  return (data: Row[]) => {
    if (filterValue === null) return data
    return data.filter(it => getter(it) === filterValue)
  }
}

function getUnique(data: Row[], getter: (row: Row) => string) {
  return Object.keys(
    data.reduce<{ [val: string]: boolean }>((acc, cur) => {
      acc[getter(cur)] = true
      return acc
    }, {}),
  ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

function fullRepoId(row: Row) {
  return `${row.owner}/${row.repo}`
}

function isBot(row: Row) {
  if (row.authorName === undefined) {
    debugger
  }
  return row.authorName.substring(0, 4) === 'bot:'
}

const shortOwner = (row: Row) =>
  row.owner === 'capralifecycle'
    ? 'cals'
    : row.owner === 'cantara'
    ? 'cantara'
    : row.owner === 'capraconsulting'
    ? 'capra'
    : row.owner

const shortNameLabel = (row: Row) =>
  row.owner === 'capralifecycle' ? row.repo : `${shortOwner(row)} / ${row.repo}`

const formatValue = (value: string | null) => (value === null ? '' : value)
const parseValue = (value: string) => (value === '' ? null : value)

const useFilterStyles = makeStyles({
  formControl: {
    margin: 10, // theme.spacing.unit,
    minWidth: 150,
  },
  input: {
    color: 'inherit',
  },
})

const Filter = ({
  handleChange,
  value,
  name,
  allValue,
  options,
}: {
  handleChange: (
    field: keyof AppState,
  ) => (e: ChangeEvent<HTMLSelectElement>) => void
  value: string | null
  name: keyof AppState
  allValue: string
  options: (string | { value: string; label: string })[]
}) => {
  const styles = useFilterStyles()

  return (
    <FormControl className={styles.formControl}>
      {/* <InputLabel
        shrink
        htmlFor={`filter-${name}`}
        className={styles.input}
        classes={{ focused: styles.formControl }}
      >
        {allValue}
      </InputLabel> */}
      <Select
        value={formatValue(value)}
        onChange={handleChange(name)}
        input={
          <Input name={name} id={`filter-${name}`} className={styles.input} />
        }
        displayEmpty
      >
        <MenuItem value=''>{allValue}</MenuItem>
        {options.map(option => {
          const value = typeof option === 'string' ? option : option.value
          const label = typeof option === 'string' ? option : option.label
          return (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )
}

interface AppState {
  filterAuthorName: string | null
  filterProject: string | null
  filterOwner: string | null
  filterRepo: string | null
  filterMerges: 'y' | 'n' | null
  filterBots: 'y' | 'n' | null
}

class App extends React.Component<
  WithStyles<typeof styles> & { data: Row[] },
  AppState
> {
  state: AppState = {
    filterAuthorName: null,
    filterProject: null,
    filterOwner: null,
    filterRepo: null,
    filterMerges: null,
    filterBots: null,
  }

  handleChange = <T extends keyof AppState>(field: T) => (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    this.setState({
      [field]: parseValue(e.target.value),
    } as { [P in T]: AppState[P] })
  }

  getFilteredData() {
    const filters = [
      buildFilter(this.state.filterAuthorName, it => it.authorName),
      buildFilter(this.state.filterProject, it => it.project),
      buildFilter(this.state.filterOwner, it => it.owner),
      buildFilter(this.state.filterRepo, fullRepoId),
      buildFilter(this.state.filterMerges, it => (it.isMerge ? 'y' : 'n')),
      buildFilter(this.state.filterBots, it => (isBot(it) ? 'y' : 'n')),
    ]

    return filters.reduce((acc, filter) => filter(acc), this.props.data)
  }

  renderFilters() {
    return (
      <>
        <Filter
          allValue='Who?'
          handleChange={this.handleChange}
          name='filterAuthorName'
          value={this.state.filterAuthorName}
          options={getUnique(this.props.data, it => it.authorName)}
        />
        <Filter
          allValue='Project?'
          handleChange={this.handleChange}
          name='filterProject'
          value={this.state.filterProject}
          options={getUnique(this.props.data, it => it.project)}
        />
        <Filter
          allValue='GitHub org?'
          handleChange={this.handleChange}
          name='filterOwner'
          value={this.state.filterOwner}
          options={getUnique(this.props.data, it => it.owner)}
        />
        <Filter
          allValue='Repo?'
          handleChange={this.handleChange}
          name='filterRepo'
          value={this.state.filterRepo}
          options={getUnique(this.props.data, fullRepoId)}
        />
        <Filter
          allValue='Include merges'
          handleChange={this.handleChange}
          name='filterMerges'
          value={this.state.filterMerges}
          options={[
            { value: 'y', label: 'Show only merges' },
            { value: 'n', label: 'Exclude merges' },
          ]}
        />
        <Filter
          allValue='Include bots'
          handleChange={this.handleChange}
          name='filterBots'
          value={this.state.filterBots}
          options={[
            { value: 'y', label: 'Show only bots' },
            { value: 'n', label: 'Exclude bots' },
          ]}
        />
      </>
    )
  }

  render() {
    const filteredData = this.getFilteredData()

    return (
      <div className={this.props.classes.layout}>
        <AppBar>
          <Toolbar>
            <div className={this.props.classes.layout}>
              {this.renderFilters()}
            </div>
          </Toolbar>
        </AppBar>
        <div
          style={{
            marginTop: '80px',
          }}
        />
        <Typography component='h1' variant='h3'>
          Git commit activity 2018
        </Typography>
        <dl>
          <dt>Total commits</dt>
          <dd>
            {filteredData.length} (
            {filteredData.filter(row => !isBot(row) && !row.isMerge).length}{' '}
            normal +{' '}
            {filteredData.filter(row => !isBot(row) && row.isMerge).length}{' '}
            merges + {filteredData.filter(isBot).length} by bots)
          </dd>
          <dt>Number of contributors</dt>
          <dd>{getUnique(filteredData, it => it.authorName).length}</dd>
          <dt>Repositories contributed to</dt>
          <dd>{getUnique(filteredData, fullRepoId).length}</dd>
        </dl>
        <Grid container>
          <Grid item xs={12} md={4}>
            <Typography component='h2' variant='h4'>
              Top projects
            </Typography>
            <TopList data={groupByTop(filteredData, row => row.project)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography component='h2' variant='h4'>
              Top contributors
            </Typography>
            <TopList data={groupByTop(filteredData, row => row.authorName)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography component='h2' variant='h4'>
              Most active repos
            </Typography>
            <TopList
              data={groupByTop(filteredData, row => shortNameLabel(row))}
              yWidth={250}
            />
          </Grid>
        </Grid>
        <Typography component='h2' variant='h4'>
          Punchcard
        </Typography>
        <Typography variant='body1' gutterBottom>
          <i>Commit timestamps are shown in your browser's timezone.</i>
        </Typography>
        <Punchcard data={filteredData} />
        <Typography component='h2' variant='h4'>
          Monthly activity
        </Typography>
        <OverallMonthly data={filteredData} />
        <Typography component='h2' variant='h4'>
          Monthly number of commits per GitHub org
        </Typography>
        <CustomLineMonthChart data={groupByMonth(filteredData, 'owner')} />
        <Typography component='h2' variant='h4'>
          Monthly number of commits per project
        </Typography>
        <CustomLineMonthChart
          data={filterByPeaks(groupByMonth(filteredData, 'project'))}
        />
        <Typography component='h2' variant='h4'>
          Monthly number of commits per author (top 15)
        </Typography>
        <CustomLineMonthChart
          data={filterByPeaks(groupByMonth(filteredData, 'authorName'))}
        />
        <Typography component='h2' variant='h4'>
          Monthly number of commits per repo (top 15)
        </Typography>
        <CustomLineMonthChart
          data={filterByPeaks(groupByMonth(filteredData, fullRepoId))}
        />
        <Typography component='h2' variant='h4'>
          Additions and deletions
        </Typography>
        <AdditionsDeletions data={filteredData} />
        <Grid container>
          <Grid item xs={12} md={6}>
            <Typography component='h2' variant='h4'>
              Full contributors list
            </Typography>
            <AllContributors data={filteredData} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography component='h2' variant='h4'>
              Full repository list
            </Typography>
            <AllRepositories data={filteredData} />
          </Grid>
        </Grid>
        <Typography component='h2' variant='h4' gutterBottom>
          All commits
        </Typography>
        <LazyCommitList data={filteredData} />
      </div>
    )
  }
}

const styles = (theme: Theme) =>
  createStyles({
    layout: {
      width: 'auto',
      marginLeft: theme.spacing.unit * 3,
      marginRight: theme.spacing.unit * 3,
      [theme.breakpoints.up(1100 + theme.spacing.unit * 3 * 2)]: {
        width: 1100,
        marginLeft: 'auto',
        marginRight: 'auto',
      },
    },
  })

const StyledApp = withStyles(styles)(App)

interface RawRow {
  owner: string
  repo: string
  project: string
  files_changed: string
  lines_inserted: string
  lines_deleted: string
  commit: string
  is_merge: 'y' | 'n'
  timestamp: string
  author_name: string
  subject: string
}

interface Row {
  owner: string
  repo: string
  project: string
  filesChanged: number
  linesInserted: number
  linesDeleted: number
  commit: string
  isMerge: boolean
  timestamp: Date
  authorName: string
  subject: string
}

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  direction: 'ltr',
  palette: {
    type: 'light',
  },
})

domready(async () => {
  const data = await new Promise<Row[]>((resolve, reject) => {
    Papa.parse(dataPath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete({ data }: { data: RawRow[] }) {
        resolve(
          data
            .map<Row>(it => ({
              owner: it.owner,
              repo: it.repo,
              project: it.project,
              filesChanged: Number(it.files_changed),
              linesInserted: Number(it.lines_inserted),
              linesDeleted: Number(it.lines_deleted),
              commit: it.commit,
              isMerge: it.is_merge === 'y',
              timestamp: new Date(it.timestamp),
              authorName: it.author_name,
              subject: it.subject,
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        )
      },
      error(err) {
        alert('Data loading failed')
        reject(err)
      },
    })
  })

  ReactDOM.render(
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <StyledApp data={data} />
    </MuiThemeProvider>,
    document.getElementById('container'),
  )
})
