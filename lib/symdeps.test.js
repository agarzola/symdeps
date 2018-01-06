const proxyquire = require('proxyquire')
const chai = require('chai')
const sinon = require('sinon')
const expect = chai.expect
chai.use(require('sinon-chai'))
const path = require('path')

var fs_mock = {
  symlinkSync: sinon.spy(),
}

const symdeps = proxyquire('./symdeps', {
  'fs': fs_mock,
})

const config = {
  paths: {
    'public/simple_deps': [ 'dep_one', 'dep_two' ],
    'public/namespaced_deps': [ 'domain/dep_one', 'domain/dep_two' ],
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

  it('should create a symlink for namespaced dependency names', () => {
    config.paths['public/namespaced_deps'].forEach(dep_name => {
      let expected_source = path.resolve('node_modules', dep_name)
      let expected_dest = path.resolve(`public/namespaced_deps/${dep_name.split('/')[1]}`)
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
})
