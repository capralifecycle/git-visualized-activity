import * as fs from "fs"

const isSnapshot = process.env.IS_SNAPSHOT === "true"

export interface BuildMeta {
  buildTimestamp: string
  buildGitCommit: string
  buildGitBranch: string
  buildNr: string
  buildTag: string
}

export interface EcrAsset {
  dockerTag: string
  ecrRepoArn: string
  ecrRepoName: string
  meta: BuildMeta
}

const ecrAssetSnapshot: EcrAsset = {
  dockerTag: "dummy",
  ecrRepoArn: "arn:aws:ecr:eu-west-1:123456789012:repository/dummy",
  ecrRepoName: "dummy",
  meta: {
    buildTimestamp: "2019-12-16T12:00:00+00:00",
    buildGitCommit: "dummy",
    buildGitBranch: "dummy",
    buildNr: "0",
    buildTag: "dummy",
  },
}

export function getEcrAsset(name: string): EcrAsset {
  if (isSnapshot) {
    return ecrAssetSnapshot
  }

  return JSON.parse(
    fs.readFileSync(`artifacts/${name}.json`, "utf-8"),
  ) as EcrAsset
}
