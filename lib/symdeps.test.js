const proxyquire = require('proxyquire')
const chai = require('chai')
const sinon = require('sinon')
const expect = chai.expect
chai.use(require('sinon-chai'))
const path = require('path')

var fs_mock = {
  symlinkSync: sinon.spy(),
  copyFileSync: sinon.spy(),
  reset_methods: function () {
    Object.keys(this).forEach(method => {
      if (this[method].reset) {
        this[method].reset()
      }
    })
  }
}

const symdeps = proxyquire('./symdeps', {
  'fs': fs_mock,
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
  after(() => fs_mock.reset_methods())

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

  describe('hard copies', () => {
    it('should copy files instead of symlinking', () => {
      config['hard-copy'] = true
      symdeps(config)

      expect(fs_mock.copyFileSync).to.have.callCount(5)
    })
  })
})
