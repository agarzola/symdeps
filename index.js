const fs = require('fs')
const path = require('path')
const symdeps = require('./lib/symdeps')

module.exports = () => {
  const package_file = fs.readFileSync(path.resolve('package.json'), 'utf8')

  try {
    const package_json = JSON.parse(package_file)
  }
  catch (error) {
    // If package.json is unreadable, something’s terribly wrong.
    console.error(error)
    process.exit(1)
  }

  const config = package_json.symdeps

  if (!config || !config.paths) {
    console.log('No symdeps directives found. Moving along…')
    return
  }

  symdeps(config)
}
