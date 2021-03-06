'use strict'

const proxyquire = require('proxyquire')
const chai = require('chai')
const sinon = require('sinon')
const expect = chai.expect
chai.use(require('sinon-chai'))
const path = require('path')

var fs_mock = {
  linkSync: sinon.spy(),
  symlinkSync: sinon.spy(),
  statSync: sinon.spy(candidate_path => {
    if (candidate_path !== path.resolve('public/existing_symlinks/existing_symlink')) {
      throw (new Error('Called fs.statSync on non-existent path.'))
    }
    return {}
  }),
  unlinkSync: sinon.spy(),
}
var mkdirp_mock = {
  sync: sinon.spy(),
}

const symdeps = proxyquire('./symdeps', {
  'fs': fs_mock,
  'mkdirp': mkdirp_mock,
})

const config = {
  paths: {
    'public/simple_deps': [ 'dep_one', 'dep_two' ],
    'public/scoped_deps': [ '@domain/dep_one', '@domain/dep_two' ],
    'public/nested_file_deps': [ 'dep_two/nested_dir/nested_file.js' ],
  },
}

describe('core', () => {
  const simple_deps_path = 'public/simple_deps'
  const scoped_deps_path = 'public/scoped_deps'
  const nested_file_deps_path = 'public/nested_file_deps'
  before(() => symdeps(config))

  it('should create a symlink for simple dependency names', () => {
    config.paths[simple_deps_path].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(simple_deps_path, dep_name)
      let expected_relative_path = path.relative(simple_deps_path, expected_source)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_relative_path, expected_dest)
    })
  })

  it('should create a symlink for scoped dependency names', () => {
    config.paths[scoped_deps_path].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(`${scoped_deps_path}/${dep_name.split('/')[1]}`)
      let expected_relative_path = path.relative(scoped_deps_path, expected_source)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_relative_path, expected_dest)
    })
  })

  it('should create a symlink for nested files', () => {
    config.paths[nested_file_deps_path].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(`${nested_file_deps_path}/nested_file.js`)
      let expected_relative_path = path.relative(nested_file_deps_path, expected_source)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_relative_path, expected_dest)
    })
  })

  it('should make intermediary directoriers in destination path if they don’t exist', () => {
    Object.keys(config.paths).forEach(group => {
      expect(mkdirp_mock.sync).to.be.calledWith(group)
    })
  })

  it('should remove existing symlinks if they exist', () => {
    Object.keys(config.paths).forEach(group => {
      config.paths[group].forEach(dep_name => {
        let dep_symlink_name = dep_name.split('/').reduce((result, segment, index, array) => {
          if (index === array.length - 1) {
            return segment
          }
        }, '')
        let expected_path = path.resolve(group, dep_symlink_name)
        expect(fs_mock.unlinkSync).to.not.be.calledWith(expected_path)
      })
    })

    config.paths['public/existing_symlinks'] = [ 'existing_symlink' ]
    symdeps(config)

    expect(fs_mock.unlinkSync).to.be.calledOnce
    expect(fs_mock.unlinkSync).to.be.calledWith(path.resolve('public/existing_symlinks/existing_symlink'))
  })
})

describe('options', () => {
  let optionsConfig

  beforeEach(() => {
    fs_mock.symlinkSync.resetHistory()
    fs_mock.linkSync.resetHistory()
    fs_mock.unlinkSync.resetHistory()
    mkdirp_mock.sync.resetHistory()

    optionsConfig = {
      paths: {
        'public/simple_deps': [ 'dep_one', 'dep_two' ],
        'public/scoped_deps': [ '@domain/dep_one', '@domain/dep_two' ],
        'public/nested_file_deps': [ 'dep_two/nested_dir/nested_file.js' ],
      },
    }
  })

  it('should create hard links if indicated via config', () => {
    optionsConfig.hard = true
    symdeps(optionsConfig)

    expect(fs_mock.linkSync).to.be.callCount(5)
    expect(fs_mock.symlinkSync).to.not.be.called
  })

  it('should use absolute paths if indicated via config', () => {
    optionsConfig.absolute = true
    symdeps(optionsConfig)
    const simple_deps_path = 'public/simple_deps'
    const scoped_deps_path = 'public/scoped_deps'
    const nested_file_deps_path = 'public/nested_file_deps'

    expect(fs_mock.symlinkSync).to.be.callCount(5)
    optionsConfig.paths[simple_deps_path].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(simple_deps_path, dep_name)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_source, expected_dest)
    })

    optionsConfig.paths[scoped_deps_path].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(`${scoped_deps_path}/${dep_name.split('/')[1]}`)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_source, expected_dest)
    })

    optionsConfig.paths[nested_file_deps_path].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(`${nested_file_deps_path}/nested_file.js`)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_source, expected_dest)
    })
  })
})
