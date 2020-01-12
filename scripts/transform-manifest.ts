#!/usr/bin/env node
import * as fs from "fs"

/* eslint-disable @typescript-eslint/no-explicit-any */

function removeTrace(data: any): any {
  if (data instanceof Array) {
    return data.map(removeTrace)
  }

  if (data === Object(data)) {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => key !== "trace")
        .map(([key, value]) => [key, removeTrace(value)]),
    )
  }

  return data
}

function removeRuntimeLibraries(data: any): any {
  const cp = {
    ...data,
    runtime: {
      ...data.runtime,
    },
  }

  delete cp.runtime.libraries
  return cp
}

// In Node, first parameter is the third element.
const file = process.argv[2]
const input = JSON.parse(fs.readFileSync(file, "utf8"))

const output = [
  // Remove the runtime version information so it don't conflict with CI
  // or other users generating the snapshots.
  removeRuntimeLibraries,
  // Remove the trace from manifest for now.
  removeTrace,
].reduce((acc, fn) => fn(acc), input)

fs.writeFileSync(file, JSON.stringify(output, undefined, "  "))
