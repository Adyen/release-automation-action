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
* Copy this [changelog configuration](.github/release.yml) into your repository and label your PR's with it's categories.

Create a workflow using this [example](.github/workflows/releases.yml):

```yaml
name: Release management

on:
  # Manual run from Github UI (e.g. for when a merged PR labels have changed)
  workflow_dispatch:
    inputs:
      # Propose a "-beta" when you want to share a testing version
      pre-release:
        required: false
        type: boolean
        default: false
        description: "This release will be labeled as non-production ready"
      # Publish the current version now, useful if the automated run failed
      github-release:
        required: false
        type: boolean
        default: false
        description: "Publish Github release for the current version"
  # Monitor pull request events
  pull_request:
    types:
      - closed
    branches:
      - main

jobs:
  release:
    # Permisson to push commits and create pull requests
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - name: Preparing the next release
        uses: Adyen/release-automation-action@v1.3.0
        with:
          # Using a PAT gives the workflow more autonomy than the default GITHUB_TOKEN  
          token: ${{ secrets.YOUR_PERSONAL_ACCESS_TOKEN || secrets.GITHUB_TOKEN }}
          # Branch to monitor, should be listed in `on.pull_request.branches`
          develop-branch: main
          # List of files (separated by spaces) to write the project's version
          version-files: package.json
          # Propose production release by default
          pre-release: ${{ inputs.pre-release || false }}
          # For a manual Github release 
          github-release: ${{ inputs.github-release || false }}
          # Prefix to be used on your Github release
          release-title: Your Project Name
```

For a complete list of inputs and outputs see [action.yml](action.yml).

# Development

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance. Consider using [Github Codespaces](https://github.com/features/codespaces) or [Gitpod](https://www.gitpod.io/).

Install the dependencies  
```bash
$ npm install
```

Build the project (will compile the TypeScript to JavaScript - outDir is `./lib`)  
```bash
$ npm run build 
```

Run the unit tests :heavy_check_mark:  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

Package for distribution (will create/update `./dist`)
```bash
$ npm run package
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

## Validate

We perform an integration test by referencing `./` in [test.yml](.github/workflows/test.yml) workflow.

See the [actions tab](https://github.com/Adyen/release-automation-action/actions) for runs of this action! 

## Self-publishing

This action automates it's own releasing. See the [releases.yml](.github/workflows/releases.yml). :rocket:

