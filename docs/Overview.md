# Overview

**noVNC-node** is a fork of [noVNC](https://github.com/kanaka/noVNC) refactored to be used with Node/browserify.


## Features

* Can integrate **noVNC** into a Node/browserify application.
* Don't pollute the `window` namespace. When loaded via a `<script>` tag it just exposes the `noVNC` module/Object.
* Removed all the non-library stuff (for example `include/ui.js` or `include/webutil.js`).
* Removed Flash feature.
* Removed "no native WebSocket" feature.
* Use the Node [debug](https://github.com/visionmedia/debug) library for debugging.
* Use [gulp](http://gulpjs.com/) to lint, test and build the browserified library.
