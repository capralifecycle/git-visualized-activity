import { FormControl, Input, MenuItem, Select } from "@material-ui/core"
import React, { ChangeEvent } from "react"
import { formatValue } from "../filters"
import { useFilterStyles } from "../styles"
import { AppState } from "../types"

interface Props {
  handleChange: (
    field: keyof AppState,
  ) => (e: ChangeEvent<HTMLSelectElement>) => void
  value: string | null
  name: keyof AppState
  allValue: string
  options: (string | { value: string; label: string })[]
}

export const Filter: React.FC<Props> = ({
  handleChange,
  value,
  name,
  allValue,
  options,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange={handleChange(name) as any} // TODO: Find out what is wrong with typings
        input={
          <Input name={name} id={`filter-${name}`} className={styles.input} />
        }
        displayEmpty
      >
        <MenuItem value="">{allValue}</MenuItem>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value
          const label = typeof option === "string" ? option : option.label
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
