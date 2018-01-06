# symdeps
Manage where your dependencies should live from `package.json`. With `symdeps`,
your dependencies are automatically symlinked according to configuration,
eliminating the need for extra code that just moves files around. Need
dependency files to be copied instead? That’s cool too.

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
  "postinstall": "symlinks"
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

### Roadmap
- **Create hard copies instead of symbolic links.** The ability to indicate
that you want hard copies instead of symbolic links one of two ways: passing a
`--hard-copy` flag to the command or setting `"hard-copy": true` in your
`symdeps` config. If either one of these is set, dependencies should be copied
instead of linked.
- **Create relative links.** The ability to generate symbolic links whose
target paths are relative to the location of the link instead of absolute. This
is useful in the creation of deployment artifacts or when otherwise moving the
application root somewhere.
