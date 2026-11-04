'use strict'

// Exercises symdeps against the real filesystem, for behavior that depends on
// how fs treats symlinks and therefore can’t be verified with a mocked fs.

const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const os = require('os')
const path = require('path')
const symdeps = require('./symdeps')

describe('filesystem', () => {
  const original_cwd = process.cwd()
  let tmp_dir

  beforeEach(() => {
    tmp_dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'symdeps-')))
    process.chdir(tmp_dir)
  })

  afterEach(() => {
    process.chdir(original_cwd)
    fs.rmSync(tmp_dir, { recursive: true, force: true })
  })

  it('should replace an existing symlink whose target no longer exists', () => {
    // A dependency used to ship the file at `src/`, but now ships it at `dist/`.
    fs.mkdirSync('node_modules/dep/dist', { recursive: true })
    fs.writeFileSync('node_modules/dep/dist/file.js', '')
    fs.mkdirSync('vendor')
    fs.symlinkSync('../node_modules/dep/src/file.js', 'vendor/file.js')

    symdeps({ paths: { vendor: [ 'dep/dist/file.js' ] } })

    expect(fs.readlinkSync('vendor/file.js')).to.equal(path.join('..', 'node_modules', 'dep', 'dist', 'file.js'))
    expect(fs.existsSync('vendor/file.js')).to.equal(true)
  })
})
