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
  test('Major', () => {
    const ver = release.nextVersion('13.1.2', 'major', '')

    expect(ver).toBe('14.0.0')
  })

  test('Minor', () => {
    const ver = release.nextVersion('13.1.2', 'minor', '')

    expect(ver).toBe('13.2.0')
  })

  test('Patch', () => {
    const ver = release.nextVersion('13.1.2', 'patch', '')

    expect(ver).toBe('13.1.3')
  })

  test('Unchanged', () => {
    const ver = release.nextVersion('1.2.3', '', '')

    expect(ver).toBe('1.2.3')
  })

  test('Start pre-release', () => {
    const ver = release.nextVersion('14.1.5', 'major', 'true')

    expect(ver).toBe('15.0.0-beta')
  })

  test('Bump first pre-release', () => {
    const ver = release.nextVersion('15.0.0-beta', 'minor', 'true')

    expect(ver).toBe('15.0.0-beta.1')
  })

  test('Bump second pre-release', () => {
    const ver = release.nextVersion('15.0.0-beta.1', 'patch', 'true')

    expect(ver).toBe('15.0.0-beta.2')
  })

  test('End pre-release', () => {
    const ver = release.nextVersion('15.0.0-beta', 'major', 'false')

    expect(ver).toBe('15.0.0')
  })
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