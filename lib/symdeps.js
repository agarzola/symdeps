const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')

module.exports = config => {
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

      if (!source || !destination) {
        return
      }

      // Check whether a symlink exists already.
      try {
        fs.statSync(destination)
        fs.unlinkSync(destination)
      }
      catch (error) {
        // Nothing to see here; the file does not exist.
      }

      // Generate intermediary destination directories, if necessary.
      mkdirp.sync(dest_base)

      // Symlink dependency.
      fs.symlinkSync(source, destination)
    })
  })
}
