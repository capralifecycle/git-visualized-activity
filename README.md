# git-visualized-activity

Generate `commits.csv` in this directory first.

```bash
npm install
npm run start
```

## Generating `commits.csv`

A CSV-file describing the repositories must first be created.
The columns should be:

1. Repository name
2. Default branch
3. Project name

The project name is used to group multiple repos.

The script `generate-repositories-list.sh` can be used to generate it:

```bash
./generate-repositories-list.sh /home/henrste/projects/capraconsulting >/tmp/repositories.csv
```

Generate the `commits.csv` file by using:

```bash
./generate-commits.sh clean
./generate-commits.sh add-header
./generate-commits.sh add-group /tmp/repositories.csv capraconsulting /home/henrste/projects/capraconsulting
```

Add more `add-group` steps to concatenate multiple root directories. The script
will fetch the remote `origin` the keep up with changes.
