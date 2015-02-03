# noVNC.js

Fork of [noVNC](https://github.com/kanaka/noVNC) to be used with Node/browserify.


## Installation

[Node.js](http://nodejs.org) must be installed.

Install `gulp-cli` 4.0 globally (which provides the `gulp` command):

```bash
$ npm install -g gulpjs/gulp-cli#4.0
```

(you can also use the local `gulp` executable located in `node_modules/.bin/gulp`).

Get the source code:

```bash
$ git clone https://github.com/eface2face/noVNC.git
$ cd noVNC/
```

Install dependencies:

```bash
$ npm install
```


## Usage in Node/browserify

Add the library to the `dependencies` field within the `package.json` file of your Node project:

```json
"dependencies": {
    "noVNC": "git+https://github.com/eface2face/noVNC.git"
}
```


## Documentation

*TODO*


## Author

This fork is maintained by Iñaki Baz Castillo at [eFace2Face, Inc.](http://eface2face.com).
