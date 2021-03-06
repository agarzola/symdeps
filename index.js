const fs = require('fs')
const path = require('path')
const symdeps = require('./lib/symdeps')

module.exports = () => {
  const package_file = fs.readFileSync(path.resolve('package.json'), 'utf8')

  if (!package_file) {
    console.log('symdeps:', 'No package.json found at current working directory.')
    return
  }

  try {
    var package_json = JSON.parse(package_file)
  }
  catch (error) {
    // If package.json cannot be parsed, something’s terribly wrong.
    console.error(error)
    process.exit(1)
    return
  }

  const config = package_json.symdeps

  if (!config || !config.paths) {
    console.log('symdeps:', 'No symdeps directives found.')
    return
  }

  config.hard = config.hard || process.argv.indexOf('--hard') > -1
  config.absolute = config.absolute || process.argv.indexOf('--absolute') > -1

  symdeps(config)
}
