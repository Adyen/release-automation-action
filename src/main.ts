import * as core from '@actions/core'
import * as release from './release'

async function run(): Promise<void> {
  try {
    await release.bump()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
