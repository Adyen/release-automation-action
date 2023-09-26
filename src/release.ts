import * as github from '@actions/github'
import * as core from '@actions/core'

export interface Label {
  name: string
}

// Github GraphQL query result
export interface Comparison {
  repository: {
    name: string
    // ref is null when the current version has not been published yet
    ref: null | {
      compare: {
        aheadBy: number
        commits: {
          edges: {
            node: {
              message: string
              associatedPullRequests: {
                edges: {
                  node: {
                    number: number
                    labels: {
                      nodes: Label[]
                    }
                  }
                }[]
              }
            }
          }[]
        }
      }
    }
  }
}

// List of merged pull requests in Markdown
export function changelog(changeset: Comparison): string[] {
  const entries: Set<number> = new Set()

  if (changeset.repository.ref !== null) {
    for (const {
      node: {associatedPullRequests: prs}
    } of changeset.repository.ref.compare.commits.edges) {
      for (const {
        node: {number: number}
      } of prs.edges) {
        entries.add(number)
      }
    }
  }

  return Array.from(entries)
      .sort((a, b) => a - b)
      .map(pr => `- #${pr}`)
}

// Next semantic version number
export function nextVersion(
    current: string,
    increment: string,
    preRelease: string
): string {
  let major: number
  let minor: number
  let patch: number
  const parts: number[] = current.split('.').map(x => parseInt(x, 10))
  ;[major, minor, patch] = parts
  const [unstaged, stage] = current.split('-')
  const isPreRelease: boolean = preRelease === 'true'

  // end pre-release
  if (!isPreRelease && stage) {
    return unstaged
  }

  // bump pre-release
  if (isPreRelease && stage) {
    const [, stageVersion] = stage.split('.')
    let version: number = parseInt(stageVersion)
    if (isNaN(version)) {
      version = 0
    }
    version++
    return `${unstaged}-beta.${version}`
  }

  switch (increment) {
    case 'patch':
      patch++
      break
    case 'minor':
      minor++
      patch = 0
      break
    case 'major':
      major++
      minor = 0
      patch = 0
      break
  }

  const version = [major, minor, patch].join('.')

  // start pre-release
  if (isPreRelease && !stage) {
    return `${version}-beta`
  }

  return version
}

interface BranchComparison {
  owner: string
  repo: string
  base: string
  head: string
}

// Compare two branches on Github
export async function compareBranches(
    token: string,
    {owner, repo, base, head}: BranchComparison
): Promise<Comparison> {
  const octokit = github.getOctokit(token)
  return await octokit.graphql(
      `
    query($owner: String!, $repo: String!, $base: String!, $head: String!) {
        repository(owner: $owner, name: $repo) {
          name
          ref(qualifiedName: $base) {
            compare(headRef: $head) {
              aheadBy
              commits(first: 100) {
                edges {
                  node {
                    message
                    associatedPullRequests(first: 5) {
                      edges {
                        node {
                          number
                          labels(first: 5) {
                            nodes {
                              name
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
    }
    `,
      {owner, repo, base, head}
  )
}

// Scan the changelog to decide what kind of release we need
export function detectChanges(changeset: Comparison): string {
  if (
      changeset.repository.ref === null ||
      changeset.repository.ref.compare.aheadBy < 1
  ) {
    // Nothing to release
    return ''
  }

  let increment = 'patch'

  // increment based on the merged PR labels
  for (const {
    node: {associatedPullRequests: prs}
  } of changeset.repository.ref.compare.commits.edges) {
    for (const {
      node: {
        labels: {nodes: labels}
      }
    } of prs.edges) {
      for (const {name: label} of labels) {
        const normalizedLabel = label.toLowerCase().replace(' ', '-')
        switch (normalizedLabel) {
          case 'feature':
            increment = 'minor'
            break
          case 'breaking-change':
            increment = 'major'
            break
        }
      }
    }
  }

  return increment
}

// Define next release
export async function bump(): Promise<void> {
  const token: string = core.getInput('token', {required: true})
  const currentVersion: string = core.getInput('current-version', {
    required: true
  })
  const preRelease: string = core.getInput('pre-release')
  const base = `v${currentVersion}`
  const head: string = core.getInput('develop-branch')

  const changeset = await compareBranches(token, {
    ...github.context.repo,
    base,
    head
  })
  const logs = changelog(changeset)
  const increment = detectChanges(changeset)
  const next = nextVersion(currentVersion, increment, preRelease)

  core.setOutput('increment', increment)
  core.setOutput('next-version', next)
  core.setOutput('changelog', logs.join('\n'))
}