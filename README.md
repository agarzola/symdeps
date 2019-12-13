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

<details>
<summary><strong>Upgrading from <code>v0.2.x</code> to <code>v1.x.x</code></strong></summary>

The switch from `v0.2.x` to `v1.0.0` or later _should_ be seamless for most
workflows, but there is one fundamental difference in the way this library
operates, so a new major version was created to be safe. `v0.2.2` and below
created symlinks using absolute paths (that is, paths relative to the root of
your environment).  For example, a symlink created at:

```
/Users/testy-mctestface/projects/project-name/js/build/libs/dependency.min.js
```

might point to:

```
/Users/testy-mctestface/projects/project-name/node_modules/dependency-name/dist/dependency.min.js
```

Starting with `v1.0.0`, `symdeps` uses paths relative to the symlink’s parent
directory. This means that the sample link described above would get the
following path to the source file instead of an absolute path:

```
../../../node_modules/dependency-name/dist/dependency.min.js
```

This is a more nimble implementation because symlinks created in one context
(say, directly in your local environment) will still be valid in a different
context (say, a docker container running on your machine, as is the case when
using something like [Lando](https://lando.dev)). They also work if you move
the project location or if you deploy an artifact to a remote environment where
you don’t want to run npm commands.

Chances are you won’t run into issues when upgrading to `v1.0.0` or later, but
if you do, it’s probably because your project has a dependency on these paths
being absolute. In that case, try [using the absolute option](#using-absolute-paths)
in your `symdeps` config and you should be fine.

Please feel free to [open a ticket](https://github.com/agarzola/symdeps/issues/new)
if you’re still running into issues with this upgrade.
</details>

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

### Using absolute paths
This library can generate symbolic links using absolute source paths (i.e.
relative to the root of your machine) instead of relative to the symlink’s
parent directory (which is the default starting with `v1.0.0`). This might be
useful in some contexts where the symlink might need to be moved or duplicated
by a process after the initial symlink is created. In such cases, you can make
`symdeps` use absolute paths by setting `"absolute": true` in your
`package.json`’s symdeps config, or by using the `--absolute` flag from the
command line.

### Creating hard links
Depending on your workflow, you might want to create hard links instead of
symbolic links. This is particularly useful if your deployment process does not
install dependencies on the remote (e.g. you might push an already built
artifact), or if you want to track front-end dependencies in version control
but don’t want to track everything in `node_modules`. You can make `symdeps`
create hard links by setting `"hard": true` in your `package.json`’s symdeps
config, or by using the `--hard` flag from the command line.
