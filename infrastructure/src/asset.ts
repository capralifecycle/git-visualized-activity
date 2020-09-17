import * as fs from "fs"
import { isSnapshot } from "./utils"

export interface EcrAsset {
  dockerTag: string
  ecrRepoArn: string
  ecrRepoName: string
}

const ecrAssetSnapshot: EcrAsset = {
  dockerTag: "dummy",
  ecrRepoArn: "arn:aws:ecr:eu-west-1:123456789012:repository/dummy",
  ecrRepoName: "dummy",
}

export function getEcrAsset(name: string): EcrAsset {
  if (isSnapshot) {
    return ecrAssetSnapshot
  }

  return JSON.parse(
    fs.readFileSync(`artifacts/${name}.json`, "utf-8"),
  ) as EcrAsset
}
