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

describe('symdeps', () => {
  before(() => symdeps(config))

  it('should create a symlink for simple dependency names', () => {
    config.paths['public/simple_deps'].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve('public/simple_deps', dep_name)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_source, expected_dest)
    })
  })

  it('should create a symlink for scoped dependency names', () => {
    config.paths['public/scoped_deps'].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(`public/scoped_deps/${dep_name.split('/')[1]}`)
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_source, expected_dest)
    })
  })

  it('should create a symlink for nested files', () => {
    config.paths['public/nested_file_deps'].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve('public/nested_file_deps/nested_file.js')
      expect(fs_mock.symlinkSync).to.be.calledWith(expected_source, expected_dest)
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

  it('should create hard links if indicated via config', () => {
    config.hard = true
    symdeps(config)
    fs_mock.symlinkSync.reset()

    expect(fs_mock.linkSync).to.be.callCount(6)
    expect(fs_mock.symlinkSync).to.not.be.called
  })
})
