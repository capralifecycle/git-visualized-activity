# webapp

## Development

Generate `commits.csv` in this directory first.

```bash
npm ci
mkdir -p dist/data
# Make the commits.csv file available with the dev server.
cp commits.csv dist/data/
npm run start
```

## Generating `commits.csv`

A CSV-file describing the repositories must first be created.
The columns should be:

1. Repository name
2. Default branch
3. Project name

The project name is used to group multiple repos.

The script `generate-repositories-list.sh` can be used to generate it,
and will cause the currently checked out branch to be used for
gathering history in the next step:

```bash
./generate-repositories-list.sh /home/henrste/projects/capraconsulting >/tmp/repositories.csv
```

Generate the `commits.csv` file by using:

```bash
../worker/generate-commits.sh clean
../worker/generate-commits.sh add-group /tmp/repositories.csv capraconsulting /home/henrste/projects/capraconsulting
```

Add more `add-group` steps to concatenate multiple root directories. The script
will fetch the remote `origin` the keep up with changes.

### Some notes

- The remote to GitHub must be named origin (will be checked).
- No local workspace is modified (except for intial cloning, as we collect
  stats using the remote ref expliclty. So fetching as we do is enough.
