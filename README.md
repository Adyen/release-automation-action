# Release Automation Action

<a href="https://github.com/Adyen/release-automation-action/actions"><img alt="status" src="https://github.com/Adyen/release-automation-action/workflows/build-test/badge.svg"></a>

A GitHub action to minimize manual steps required to release (semantic) versions of a software project. 

1. Runs every time a pull request is merged against a branch where you do development and releases
2. Looks through all the merged PR's since the previous release
3. Based on their labels (e.g. "Breaking change", "Feature", "Fix"), creates a new PR proposing which version to release next
4. Once the proposed version PR is merged, it will publish the respective Github release

# Usage

## Prerequisites

* Branch protection rules (in Branch Settings)
  - To prevent auto-merging releases into your `develop-branch` without reviews (e.g. 2 approvals)
* Allow auto-merge (in General Settings)
  - If you want to release right after merging the PR, otherwise use the `enable-auto-merge` option
* Allow GitHub Actions to create and approve pull requests (in Actions Settings)
  - If you use the default `secrets.GITHUB_TOKEN`, otherwise use a `repo` scoped Personal Access Token (PAT)

Copy this [changelog configuration](.github/release.yml) into your repository and label your PR's with it's categories.

Create a workflow using this [example](.github/workflows/releases.yml):

```
name: Release management

on:
  workflow_dispatch:
    inputs:
      pre-release:
        required: false
        type: boolean
        default: false
        description: "This release will be labeled as non-production ready"
      github-release:
        required: false
        type: boolean
        default: false
        description: "Publish Github release for the current version"
  pull_request:
    types:
      - closed
    branches:
      - main

jobs:
  release:
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - name: Preparing the next release
        uses: Adyen/release-automation-action@v1.2.0
        with:
          token: ${{ secrets.YOUR_PERSONAL_ACCESS_TOKEN || secrets.GITHUB_TOKEN }}
          develop-branch: main
          version-files: package.json
          pre-release: ${{ inputs.pre-release || false }}
          github-release: ${{ inputs.github-release || false }}
          release-title: Your Project Name
```

This example contains two inputs that can be provided manually (`workflow_dispatch`) via the Github UI: 

* Pre-release: will prepare a "-beta" version for when you want to share a "testing" version.
* Github-release: to publish the current/first version now if the automated run failed

## Inputs

| Input               | Default      | Description                                                 |
| ------------------- | ------------ | ----------------------------------------------------------- |
| `token`             | github.token | GITHUB_TOKEN or a `repo` scoped Personal Access Token (PAT) |
| `release-title`     |              | Release title prefix                                        |
| `pre-release`       | false        | This release will be labeled as non-production ready        |
| `separator`         | -beta        | Separator between main version and pre-release version      |
| `develop-branch`    | main         | Branch used for development and distribution                |
| `version-files`     |              | A list of files to write a version number                   |
| `github-release`    |              | Publish Github release for the current version              |
| `enable-auto-merge` | 1            | Enable release pull request auto-merge                      |

## Outputs

| Output         | Description                                    |
| -------------- | ---------------------------------------------- |
| `increment`    | Type of the next release (e.g. major)          |
| `next-version` | Suggestion of which version should go out next |
| `changelog`    | List of merged pull requests unreleased        |

# Development

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance. Consider using [Github Codespaces](https://github.com/features/codespaces) or [Gitpod](https://www.gitpod.io/).

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

## Change the Code

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

```javascript
import * as core from '@actions/core';
...

async function run() {
  try { 
      ...
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

This action performs an integration test by referencing `./` in a [test.yml](.github/workflows/test.yml) workflow.

See the [actions tab](https://github.com/Adyen/release-automation-action/actions) for runs of this action! :rocket:


Disclaimer: _This is not an officially supported Adyen product._