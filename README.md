# noVNC-node

Fork of [noVNC](https://github.com/kanaka/noVNC) to be used with Node/browserify.


## Installation

* With **npm**:

```bash
$ npm install --save novnc-node
```


## Usage in Node/browserify

```javascript
var noVNC = require('novnc-node');
```


## Browserified library

Take the browserified version of the library at `dist/novnc-node-X.Y.Z.js`. It exposes the global `window.noVNC` module/Object.

```html
<script src='novnc-node-X.Y.Z.js'></script>
```

The browserified version is built with [browserify](browserify.org), meaning that when it is loaded with a `<script>` it just exposes the global `noVNC` module/Object if there is not a JavaScript module loader (`RequireJS`, etc) in use.


## Documentation

Read the full [API documentation](docs/index.md) in the *docs* folder.


## Development

[Node.js](http://nodejs.org) must be installed.

Install `gulp-cli` 4.0 globally (which provides the `gulp` command):

```bash
$ npm install -g gulpjs/gulp-cli#4.0
```

(you can also use the local `gulp` executable located in `node_modules/.bin/gulp`).

Get the source code:

```bash
$ git clone https://github.com/eface2face/noVNC-node.git
$ cd noVNC/
```

Install dependencies:

```bash
$ npm install
```

And run `gulp` (or `node_modules/.bin/gulp`):

```bash
$ gulp
```


## Author

This fork is maintained by Iñaki Baz Castillo at [eFace2Face, Inc.](http://eface2face.com).
