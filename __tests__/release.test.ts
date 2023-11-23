import * as release from '../src/release'
import {jest, describe, test, expect} from '@jest/globals'

const github = require('@actions/github')
const core = require('@actions/core')

jest.mock('@actions/github')
jest.mock('@actions/core')

const comparisonFixture: release.Comparison = {
  repository: {
    name: 'adyen-node-api-library',
    ref: {
      compare: {
        aheadBy: 8,
        commits: {
          edges: [
            {
              node: {
                message: 'Another commit in the same PR non squashed',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 20,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Breaking change'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Fixing the constructor',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 10,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Fix'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Upgrade some service',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 20,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Breaking change'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Update CODEOWNERS (#965)',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 30,
                        merged: false,
                        labels: {
                          nodes: []
                        }
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    }
  }
}

const associatedPullRequestsMajor = {
  repository: {
    name: 'adyen-node-api-library',
    ref: {
      compare: {
        aheadBy: 8,
        commits: {
          edges: [
            {
              node: {
                message: 'Another commit in the same PR non squashed',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 20,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Breaking change'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Fixing the constructor',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 10,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Fix'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Upgrade some service',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 20,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Feature'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Update CODEOWNERS (#965)',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 30,
                        merged: true,
                        labels: {
                          nodes: []
                        }
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    }
  }
}

const associatedPullRequestsMinor = {
  repository: {
    name: 'adyen-node-api-library',
    ref: {
      compare: {
        aheadBy: 8,
        commits: {
          edges: [
            {
              node: {
                message: 'Another commit in the same PR non squashed',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 20,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: ''
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Fixing the constructor',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 10,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Feature'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Upgrade some service',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 20,
                        merged: true,
                        labels: {
                          nodes: [
                            {
                              name: 'Fix'
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                message: 'Update CODEOWNERS (#965)',
                associatedPullRequests: {
                  edges: [
                    {
                      node: {
                        number: 30,
                        merged: true,
                        labels: {
                          nodes: []
                        }
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    }
  }
}

const refNotFound: release.Comparison = {
  repository: {name: 'adyen-cobol-api-library', ref: null}
}

test('Changelog', () => {
  const changelog = release.changelog(comparisonFixture)

  expect(changelog).toStrictEqual(['- #10', '- #20', '- #30'])
})

test('Changelog null ref', () => {
  const changelog = release.changelog(refNotFound)

  expect(changelog).toStrictEqual([])
})

test('Filter merged PR', () => {
  const merged = release.filterMerged(comparisonFixture)
  const changelog = release.changelog(merged)

  expect(changelog).toStrictEqual(['- #10', '- #20'])
})

test('Filter merged PR no changes', () => {
  const merged = release.filterMerged(refNotFound)

  expect(merged).toStrictEqual(refNotFound)
})

describe('Detect changes', () => {
  test('Major', () => {
    const ver = release.detectChanges(comparisonFixture)

    expect(ver).toBe('major')
  })

  test('Zero changes', () => {
    let sync = structuredClone(comparisonFixture)
    sync.repository.ref!.compare.aheadBy = 0

    const ver = release.detectChanges(sync)

    expect(ver).toBe('')
  })

  test('Ref not found', () => {
    const ver = release.detectChanges(refNotFound)

    expect(ver).toBe('')
  })

  test('No labels', () => {
    let noLabels = structuredClone(comparisonFixture)
    for (const edge of noLabels.repository.ref!.compare.commits.edges) {
      for (const prs of edge.node.associatedPullRequests.edges) {
        prs.node.labels.nodes = []
      }
    }

    const ver = release.detectChanges(noLabels)

    expect(ver).toBe('patch')
  })

  test('Major first', () => {
    const ver = release.detectChanges(associatedPullRequestsMajor)

    expect(ver).toBe('major')
  })

  test('Minor', () => {
    const ver = release.detectChanges(associatedPullRequestsMinor)

    expect(ver).toBe('minor')
  })
})

describe('Get next version', () => {
  const separator = '-beta'
  const customSeparator = '.pre'

  test('Missing separator', () => {
    expect(() =>
      release.nextVersion('15.0.0-beta', 'major', 'false', '')
    ).toThrow('Separator is required')
  })

  test.each([
    // 'Major'
    ['13.1.2', 'major', '', separator, '14.0.0'],
    // 'Minor'
    ['13.1.2', 'minor', '', separator, '13.2.0'],
    // 'Patch'
    ['13.1.2', 'patch', '', separator, '13.1.3'],
    // 'Unchanged'
    ['1.2.3', '', '', separator, '1.2.3'],
    // 'Start pre-release'
    ['14.1.5', 'major', 'true', separator, '15.0.0-beta'],
    ['14.1.5', 'major', 'true', customSeparator, '15.0.0.pre'],
    ['14.1.5', 'major', 'true', '.pre.alpha', '15.0.0.pre.alpha'],
    // 'Bump first pre-release'
    ['15.0.0-beta', 'minor', 'true', separator, '15.0.0-beta.1'],
    ['15.0.0.pre', 'minor', 'true', customSeparator, '15.0.0.pre.1'],
    ['15.0.0.pre.beta', 'minor', 'true', '.pre.beta', '15.0.0.pre.beta.1'],
    // 'Bump second pre-release'
    ['15.0.0-beta.1', 'patch', 'true', separator, '15.0.0-beta.2'],
    ['15.0.0.pre.1', 'patch', 'true', customSeparator, '15.0.0.pre.2'],
    ['15.0.0.pre.beta.1', 'patch', 'true', '.pre.beta', '15.0.0.pre.beta.2'],
    // 'End pre-release'
    ['15.0.0-beta', 'major', 'false', separator, '15.0.0'],
    ['8.0.0.pre.beta.1', 'major', 'false', customSeparator, '8.0.0']
  ])(
    'current(%s), increment(%s), preRelease(%s), separator(%s)',
    (current, increment, preRelease, separator, expected) => {
      const ver = release.nextVersion(current, increment, preRelease, separator)

      expect(ver).toBe(expected)
    }
  )
})

test('Compare branches', async () => {
  github.getOctokit.mockReturnValue({
    graphql: jest.fn(x => comparisonFixture)
  })

  const diff = await release.compareBranches('fake token', {
    owner: 'Adyen',
    repo: 'adyen-node-api-library',
    base: 'main',
    head: 'develop'
  })

  expect(diff.repository.name).toBe('adyen-node-api-library')
})

test('Bump', async () => {
  github.getOctokit.mockReturnValue({
    graphql: jest.fn(x => comparisonFixture)
  })
  core.getInput.mockImplementation((input: string) => {
    switch (input) {
      case 'current-version':
        return '1.2.3'
      case 'separator':
        return '-beta'
      default:
        return ''
    }
  })
  github.context = {
    repo: {
      owner: 'Adyen',
      repo: 'adyen-rust-api-library'
    }
  }

  await release.bump()

  expect(core.getInput).toHaveBeenCalledWith('current-version', {
    required: true
  })
  expect(core.setOutput).toHaveBeenCalledTimes(3)
  expect(core.setOutput).toHaveBeenCalledWith('increment', 'major')
  expect(core.setOutput).toHaveBeenCalledWith('next-version', '2.0.0')
})
