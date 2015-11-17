/*
 * Websock: high-performance binary WebSockets
 * Copyright (C) 2012 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * Websock is similar to the standard WebSocket object but Websock
 * enables communication with raw TCP sockets (i.e. the binary stream)
 * via websockify. This is accomplished by base64 encoding the data
 * stream between Websock and websockify.
 *
 * Websock has built-in receive queue buffering; the message event
 * does not contain actual data but is simply a notification that
 * there is new data available. Several rQ* methods are available to
 * read binary data off of the receive queue.
 */


/**
 * Dependencies.
 */
var debug = require('debug')('noVNC:Websock');
var debugerror = require('debug')('noVNC:ERROR:Websock');
debugerror.log = console.warn.bind(console);
var browser = require('bowser').browser;
var Base64 = require('./base64');


/**
 * Expose Websock class.
 */
module.exports = Websock;


function Websock() {
	this._websocket = null;  // WebSocket object
	this._rQ = [];           // Receive queue
	this._rQi = 0;           // Receive queue index
	this._rQmax = 10000;     // Max receive queue size before compacting
	this._sQ = [];           // Send queue

	this._mode = 'base64';    // Current WebSocket mode: 'binary', 'base64'
	this.maxBufferedAmount = 200;

	this._eventHandlers = {
		'message': function () {},
		'open': function () {},
		'close': function () {},
		'error': function () {}
	};
}


Websock.prototype = {
	// Getters and Setters
	get_sQ: function () {
		return this._sQ;
	},

	get_rQ: function () {
		return this._rQ;
	},

	get_rQi: function () {
		return this._rQi;
	},

	set_rQi: function (val) {
		this._rQi = val;
	},

	// Receive Queue
	rQlen: function () {
		return this._rQ.length - this._rQi;
	},

	rQpeek8: function () {
		return this._rQ[this._rQi];
	},

	rQshift8: function () {
		return this._rQ[this._rQi++];
	},

	rQskip8: function () {
		this._rQi++;
	},

	rQskipBytes: function (num) {
		this._rQi += num;
	},

	rQunshift8: function (num) {
		if (this._rQi === 0) {
			this._rQ.unshift(num);
		} else {
			this._rQi--;
			this._rQ[this._rQi] = num;
		}
	},

	rQshift16: function () {
		return (this._rQ[this._rQi++] << 8) +
			   this._rQ[this._rQi++];
	},

	rQshift32: function () {
		return (this._rQ[this._rQi++] << 24) +
			   (this._rQ[this._rQi++] << 16) +
			   (this._rQ[this._rQi++] << 8) +
			   this._rQ[this._rQi++];
	},

	rQshiftStr: function (len) {
		if (typeof(len) === 'undefined') { len = this.rQlen(); }
		var arr = this._rQ.slice(this._rQi, this._rQi + len);
		this._rQi += len;
		return String.fromCharCode.apply(null, arr);
	},

	rQshiftBytes: function (len) {
		if (typeof(len) === 'undefined') { len = this.rQlen(); }
		this._rQi += len;
		return this._rQ.slice(this._rQi - len, this._rQi);
	},

	rQslice: function (start, end) {
		if (end) {
			return this._rQ.slice(this._rQi + start, this._rQi + end);
		} else {
			return this._rQ.slice(this._rQi + start);
		}
	},

	// Check to see if we must wait for 'num' bytes (default to FBU.bytes)
	// to be available in the receive queue. Return true if we need to
	// wait (and possibly print a debug message), otherwise false.
	rQwait: function (msg, num, goback) {
		var rQlen = this._rQ.length - this._rQi; // Skip rQlen() function call
		if (rQlen < num) {
			if (goback) {
				if (this._rQi < goback) {
					throw new Error('rQwait cannot backup ' + goback + ' bytes');
				}
				this._rQi -= goback;
			}
			return true; // true means need more data
		}
		return false;
	},

	// Send Queue

	flush: function () {
		if (this._websocket.bufferedAmount !== 0) {
			debug('flush() | bufferedAmount: %d', this._websocket.bufferedAmount);
		}

		if (this._websocket.bufferedAmount < this.maxBufferedAmount) {
			if (this._sQ.length > 0) {
				this._websocket.send(this._encode_message());
				this._sQ = [];
			}

			return true;
		} else {
			debug('flush() | delaying send');
			return false;
		}
	},

	send: function (arr) {
	   this._sQ = this._sQ.concat(arr);
	   return this.flush();
	},

	send_string: function (str) {
		this.send(str.split('').map(function (chr) {
			return chr.charCodeAt(0);
		}));
	},

	// Event Handlers
	on: function (evt, handler) {
		this._eventHandlers[evt] = handler;
	},

	off: function (evt) {
		this._eventHandlers[evt] = function() {};
	},

	init: function (protocols) {
		this._rQ = [];
		this._rQi = 0;
		this._sQ = [];
		this._websocket = null;

		// Check for full typed array support
		var bt = false;
		if (('Uint8Array' in global) && ('set' in Uint8Array.prototype)) {
			bt = true;
		}

		var wsbt = false;
		if (global.WebSocket) {
			// Safari < 7 does not support binary WS.
			if (browser.safari && Number(browser.version) > 0 && Number(browser.version) < 7) {
				debug('init() | Safari %d does not support binary WebSocket', Number(browser.version));
			}
			else {
				wsbt = true;
			}
		}

		// Default protocols if not specified
		if (typeof(protocols) === 'undefined') {
			if (wsbt) {
				protocols = ['binary', 'base64'];
			} else {
				protocols = 'base64';
			}
		}

		if (!wsbt) {
			if (protocols === 'binary') {
				throw new Error('WebSocket binary sub-protocol requested but not supported');
			}

			if (typeof(protocols) === 'object') {
				var new_protocols = [];

				for (var i = 0; i < protocols.length; i++) {
					if (protocols[i] === 'binary') {
						debugerror('init() | skipping unsupported WebSocket binary sub-protocol');
					} else {
						new_protocols.push(protocols[i]);
					}
				}

				if (new_protocols.length > 0) {
					protocols = new_protocols;
				} else {
					throw new Error('only WebSocket binary sub-protocol was requested and is not supported');
				}
			}
		}

		return protocols;
	},

	open: function (uri, protocols) {
		var self = this;

		protocols = this.init(protocols);

		// this._websocket = new WebSocket(uri, protocols);
		// TODO: Add API or settings for passing the W3C WebSocket class.
		if (global.NativeWebSocket) {
			debug('open() | using NativeWebSocket');
			this._websocket = new global.NativeWebSocket(uri, protocols);
		} else {
			debug('open() | not using NativeWebSocket');
			this._websocket = new WebSocket(uri, protocols);
		}

		if (protocols.indexOf('binary') >= 0) {
			this._websocket.binaryType = 'arraybuffer';
		}

		this._websocket.onmessage = function (e) {
			self._recv_message(e);
		};

		this._websocket.onopen = function() {
			if (self._websocket.protocol) {
				debug('onopen: server choose "%s" sub-protocol', self._websocket.protocol);
				self._mode = self._websocket.protocol;
				self._eventHandlers.open();
			}
			else {
				debugerror('onopen: server choose no sub-protocol, using "base64"');
				self._mode = 'base64';
				self._eventHandlers.open();
			}
		};

		this._websocket.onclose = function (e) {
			debug('onclose: %o', e);
			self._eventHandlers.close(e);
		};

		this._websocket.onerror = function (e) {
			debugerror('onerror: %o', e);
			self._eventHandlers.error(e);
		};
	},

	close: function () {
		if (this._websocket) {
			if ((this._websocket.readyState === this._websocket.OPEN) ||
					(this._websocket.readyState === this._websocket.CONNECTING)) {
				debug('close()');
				this._websocket.close();
			}

			this._websocket.onmessage = function () { return; };
		}
	},

	// private methods

	_encode_message: function () {
		if (this._mode === 'binary') {
			// Put in a binary arraybuffer
			return (new Uint8Array(this._sQ)).buffer;
		} else {
			// base64 encode
			return Base64.encode(this._sQ);
		}
	},

	_decode_message: function (data) {
		if (this._mode === 'binary') {
			// push arraybuffer values onto the end
			var u8 = new Uint8Array(data);
			for (var i = 0; i < u8.length; i++) {
				this._rQ.push(u8[i]);
			}
		} else {
			// base64 decode and concat to end
			this._rQ = this._rQ.concat(Base64.decode(data, 0));
		}
	},

	_recv_message: function (e) {
		try {
			this._decode_message(e.data);
			if (this.rQlen() > 0) {
				this._eventHandlers.message();
				// Compact the receive queue
				if (this._rQ.length > this._rQmax) {
					this._rQ = this._rQ.slice(this._rQi);
					this._rQi = 0;
				}
			} else {
				debug('_recv_message() | ignoring empty message');
			}
		} catch (error) {
			debugerror('_recv_message() | error: %o', error);

			if (typeof error.name !== 'undefined') {
				this._eventHandlers.error(error.name + ': ' + error.message);
			} else {
				this._eventHandlers.error(error);
			}
		}
	}
};
