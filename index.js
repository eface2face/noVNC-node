/**
 * Dependencies.
 */
var Util = require('./lib/util');
var Keys = require('./lib/keys');
var KbdUtil = require('./lib/kbdutil');
var Input = require('./lib/input');
var Websock = require('./lib/websock');
var Base64 = require('./lib/base64');
// var RFB = require('./lib/rfb');


var noVNC = {
	Util: Util,
	Keys: Keys,
	KbdUtil: KbdUtil,
	Input: Input,
	Websock: Websock,
	Base64: Base64,
	// RFB: RFB
};


module.exports = noVNC;
