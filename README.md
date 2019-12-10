# symdeps
Manage where your dependencies should live from `package.json`. With `symdeps`,
your dependencies are automatically symlinked according to configuration,
eliminating the need for extra code that just moves files around. Need hard
links? That’s cool too.

### Hang on. My task runner already does this.
If your task runner’s only role in your workflow is to move files around, you’re
essentially using a [Jaeger](https://pacificrim.wikia.com/wiki/Jaeger "But when
you’re in a Jaeger, suddenly, you can fight the hurricane.") to pick up a
pebble. If you use a task runner to do more than just that, consider whether
defining a non-standard location for your dependencies should be done in your
task runner config or in your package manager config.

## Installation
To install `symdeps`, run:
```
npm install --save-dev symdeps
```

## Usage
Add something like this to your `package.json`:
```javascript
// package.json
"symdeps": {
  "paths": {
    "public/js/vendor": [ "jquery", "mediaelement" ]
  }
}
```

and invoke `symdeps` from an npm script, like `postinstall`:
```javascript
// package.json
"scripts": {
  "postinstall": "symdeps"
}
```

Now every time a dependency is installed, `symdeps` will create symbolic links
in your `public/js/vendor/` directory like this:
```
// relative to project root

public/js/vendor/jquery
public/js/vendor/mediaelement
```

### Naïve behavior
`symdeps` will create any directories that don’t already exist along the base
path (`public/js/vendor` in the example above). Also note that if the
destination already exists (whether it be a file, symlink, or directory) it
will be replaced with the symlink.

### Linking files directly
You can target individual files quite simply like so:
```javascript
// package.json
"symdeps": {
  "paths": {
    "public/js/vendor": [
      "jquery/dist/jquery.min.js",
      "mediaelement/build/mediaelement-and-player.min.js"
    ]
  }
}
```

This will symlink these dependencies like this:
```
// relative to project root

public/js/vendor/jquery.min.js
public/js/vendor/mediaelement-and-player.min.js
```

### Linking scoped dependencies
If you’re installing a dependency that’s scoped (e.g. `@project/library`),
`symdeps` will symlink the library name directly (excluding the scope segment
in the package name). So adding `@project/library` to the path array in the
examples above would result in a symlink at:
`project_root/public/js/vendor/library`.

### Using relative links
This library can generate symbolic links using relative source paths that are
relative to the location of the link instead of absolute (which is the
default). This is useful in the creation of deployment artifacts, when using
container environments where the symlinks may be created outside the container,
or when otherwise moving the application root somewhere. You can make `symdeps`
use relative paths by setting `"relative": true` in your `package.json`’s
symdeps config, or by using the `--relative` flag from the command line.

### Using hard links
Depending on your workflow, you might want to use hard links instead of
symbolic links. This is particularly useful if your deployment process does not
install dependencies on the remote (you might push a built artifact, for
example), or if you want to track front-end dependencies in version control but
don’t want to track everything in `node_modules`. You can make `symdeps` create
hard links by setting `"hard": true` in your `package.json`’s symdeps config,
or by using the `--hard` flag from the command line.
