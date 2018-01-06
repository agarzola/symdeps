const fs = require('fs')
const path = require('path')

module.exports = config => {
  const fs_method = config['hard-copy'] ? 'copyFileSync' : 'symlinkSync'

  Object.keys(config.paths).forEach(dest_base => {
    let directives = config.paths[dest_base]
    directives.forEach(directive => {
      let source, destination
      if (typeof directive === 'string') {
        source = path.resolve('node_modules', directive)
        destination = path.resolve(
          dest_base,
          directive.split(path.sep).reduce((result, segment, i, array) => {
            return array.length - 1 === i ? segment : ''
          }, '')
        )
      }

      if (source && destination) {
        fs[fs_method](source, destination)
      }
    })
  })
}
