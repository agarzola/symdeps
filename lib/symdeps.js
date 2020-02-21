'use strict'

const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')

module.exports = config => {
  const fs_method = config.hard ? 'linkSync' : 'symlinkSync'

  Object.keys(config.paths).forEach(dest_base => {
    const directives = config.paths[dest_base]
    // Hard links are relative to the CWD; symlinks are relative to the target.
    const relative_base = config.hard ? process.cwd() : path.resolve(dest_base)

    directives.forEach(directive => {
      let source, destination
      if (typeof directive === 'string') {
        const absolute_source = path.resolve('node_modules', directive)
        source = config.absolute ? absolute_source : path.relative(relative_base, absolute_source)
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
      fs[fs_method](source, destination)
    })
  })
}
