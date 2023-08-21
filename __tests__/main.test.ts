import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  // process.env['INPUT_TOKEN'] = 'my secret token'
  process.env['INPUT_CURRENT-VERSION'] = '1.2.3'
  const nodePath = process.execPath
  const script = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }

  try {
    cp.execFileSync(nodePath, [script], options)
  } catch (e: any) {
    const stdout = e.stdout as Buffer
    expect(stdout.toString()).toContain(
      'Input required and not supplied: token'
    )
  }
})
