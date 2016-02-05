/*
 * noVNC: HTML5 VNC client
 * Copyright (C) 2012 Joel Martin
 * Copyright (C) 2013 Samuel Mannehed for Cendio AB
 * Licensed under MPL 2.0 or any later version (see LICENSE.txt)
 */


/**
 * Expose the Input Object.
 */
var Input = module.exports = {};


/**
 * Dependencies.
 */
var debugkeyboard = require('debug')('noVNC:Input:Keybord');
var debugmouse = require('debug')('noVNC:Input:Mouse');
var browser = require('bowser').browser;
var Util = require('./util');
var kbdUtil = require('./kbdutil');


function Keyboard (defaults) {
	this._keyDownList = [];  // List of depressed keys
									         // (even if they are happy)

	Util.set_defaults(this, defaults, {
		'target': document,
		'focused': true
	});

	// create the keyboard handler
	this._handler = new kbdUtil.KeyEventDecoder(kbdUtil.ModifierSync(),
		kbdUtil.VerifyCharModifier(
			kbdUtil.TrackKeyState(
				kbdUtil.EscapeModifiers(this._handleRfbEvent.bind(this))
			)
		)
	); /* jshint newcap: true */

	// keep these here so we can refer to them later
	this._eventHandlers = {
		'keyup': this._handleKeyUp.bind(this),
		'keydown': this._handleKeyDown.bind(this),
		'keypress': this._handleKeyPress.bind(this),
		'blur': this._allKeysUp.bind(this)
	};
}


Keyboard.prototype = {
	_handleRfbEvent: function (e) {
		if (this._onKeyPress) {
			debugkeyboard('onKeyPress: ' + (e.type === 'keydown' ? 'down' : 'up') +
					   ', keysym: ' + e.keysym.keysym + '(' + e.keysym.keyname + ')');
			this._onKeyPress(e.keysym.keysym, e.type === 'keydown');
		}
	},

	_handleKeyDown: function (e) {
		if (!this._focused) { return true; }

		if (this._handler.keydown(e)) {
			// Suppress bubbling/default actions
			Util.stopEvent(e);
			return false;
		} else {
			// Allow the event to bubble and become a keyPress event which
			// will have the character code translated
			return true;
		}
	},

	_handleKeyPress: function (e) {
		if (!this._focused) { return true; }

		if (this._handler.keypress(e)) {
			// Suppress bubbling/default actions
			Util.stopEvent(e);
			return false;
		} else {
			// Allow the event to bubble and become a keyPress event which
			// will have the character code translated
			return true;
		}
	},

	_handleKeyUp: function (e) {
		if (!this._focused) { return true; }

		if (this._handler.keyup(e)) {
			// Suppress bubbling/default actions
			Util.stopEvent(e);
			return false;
		} else {
			// Allow the event to bubble and become a keyUp event which
			// will have the character code translated
			return true;
		}
	},

	_allKeysUp: function () {
		debugkeyboard('allKeysUp');
		this._handler.releaseAll();
	},

	// Public methods

	grab: function () {
		debugkeyboard('grab()');

		var c = this._target;

		Util.addEvent(c, 'keydown', this._eventHandlers.keydown);
		Util.addEvent(c, 'keyup', this._eventHandlers.keyup);
		Util.addEvent(c, 'keypress', this._eventHandlers.keypress);

		// Release (key up) if global loses focus
		Util.addEvent(global, 'blur', this._eventHandlers.blur);
	},

	ungrab: function () {
		debugkeyboard('ungrab()');

		var c = this._target;

		Util.removeEvent(c, 'keydown', this._eventHandlers.keydown);
		Util.removeEvent(c, 'keyup', this._eventHandlers.keyup);
		Util.removeEvent(c, 'keypress', this._eventHandlers.keypress);
		Util.removeEvent(global, 'blur', this._eventHandlers.blur);

		// Release (key up) all keys that are in a down state
		this._allKeysUp();
	},

	sync: function (e) {
		this._handler.syncModifiers(e);
	}
};


Util.make_properties(Keyboard, [
	['target',     'wo', 'dom'],  // DOM element that captures keyboard input
	['focused',    'rw', 'bool'], // Capture and send key events
	['onKeyPress', 'rw', 'func'] // Handler for key press/release
]);


function Mouse (defaults) {
	this._mouseCaptured  = false;

	this._doubleClickTimer = null;
	this._lastTouchPos = null;

	// Configuration attributes
	Util.set_defaults(this, defaults, {
		'target': document,
		'focused': true,
		'scale': 1.0,
		'zoom': 1.0,
		'touchButton': 1
	});

	this._eventHandlers = {
		'mousedown': this._handleMouseDown.bind(this),
		'mouseup': this._handleMouseUp.bind(this),
		'mousemove': this._handleMouseMove.bind(this),
		'mousewheel': this._handleMouseWheel.bind(this),
		'mousedisable': this._handleMouseDisable.bind(this)
	};
}


Mouse.prototype = {
	_captureMouse: function () {
		// capturing the mouse ensures we get the mouseup event
		if (this._target.setCapture) {
			this._target.setCapture();
		}

		// some browsers give us mouseup events regardless,
		// so if we never captured the mouse, we can disregard the event
		this._mouseCaptured = true;
	},

	_releaseMouse: function () {
		if (this._target.releaseCapture) {
			this._target.releaseCapture();
		}
		this._mouseCaptured = false;
	},

	_resetDoubleClickTimer: function () {
		this._doubleClickTimer = null;
	},

	_handleMouseButton: function (e, down) {
		if (!this._focused) { return true; }

		if (this._notify) {
			this._notify(e);
		}

		var evt = (e ? e : global.event);
		var pos = Util.getEventPosition(e, this._target, this._scale, this._zoom);

		var bmask;
		if (e.touches || e.changedTouches) {
			// Touch device

			// When two touches occur within 500 ms of each other and are
			// closer than 20 pixels together a double click is triggered.
			if (down === 1) {
				if (this._doubleClickTimer === null) {
					this._lastTouchPos = pos;
				} else {
					clearTimeout(this._doubleClickTimer);

					// When the distance between the two touches is small enough
					// force the position of the latter touch to the position of
					// the first.

					var xs = this._lastTouchPos.x - pos.x;
					var ys = this._lastTouchPos.y - pos.y;
					var d = Math.sqrt((xs * xs) + (ys * ys));

					// The goal is to trigger on a certain physical width, the
					// devicePixelRatio brings us a bit closer but is not optimal.
					if (d < 20 * global.devicePixelRatio) {
						pos = this._lastTouchPos;
					}
				}
				this._doubleClickTimer = setTimeout(this._resetDoubleClickTimer.bind(this), 500);
			}
			bmask = this._touchButton;
			// If bmask is set
		} else if (evt.which) {
			/* everything except IE */
			bmask = 1 << evt.button;
		} else {
			/* IE including 9 */
			bmask = (evt.button & 0x1) +      // Left
					(evt.button & 0x2) * 2 +  // Right
					(evt.button & 0x4) / 2;   // Middle
		}

		if (this._onMouseButton) {
			debugmouse('onMouseButton: ' + (down ? 'down' : 'up') +
					   ', x: ' + pos.x + ', y: ' + pos.y + ', bmask: ' + bmask);
			this._onMouseButton(pos.x, pos.y, down, bmask);
		}

		Util.stopEvent(e);
		return false;
	},

	_handleMouseDown: function (e) {
		this._captureMouse();
		this._handleMouseButton(e, 1);
	},

	_handleMouseUp: function (e) {
		if (!this._mouseCaptured) { return; }

		this._handleMouseButton(e, 0);
		this._releaseMouse();
	},

	_handleMouseWheel: function (e) {
		if (!this._focused) { return true; }

		if (this._notify) {
			this._notify(e);
		}

		var evt = (e ? e : global.event);
		var pos = Util.getEventPosition(e, this._target, this._scale, this._zoom);
		var wheelData = evt.detail ? evt.detail * -1 : evt.wheelDelta / 40;
		var bmask;
		if (wheelData > 0) {
			bmask = 1 << 3;
		} else {
			bmask = 1 << 4;
		}

		if (this._onMouseButton) {
			this._onMouseButton(pos.x, pos.y, 1, bmask);
			this._onMouseButton(pos.x, pos.y, 0, bmask);
		}

		Util.stopEvent(e);
		return false;
	},

	_handleMouseMove: function (e) {
		if (!this._focused) { return true; }

		if (this._notify) {
			this._notify(e);
		}

		var pos = Util.getEventPosition(e, this._target, this._scale, this._zoom);
		if (this._onMouseMove) {
			this._onMouseMove(pos.x, pos.y);
		}

		Util.stopEvent(e);
		return false;
	},

	_handleMouseDisable: function (e) {
		if (!this._focused) { return true; }

		var pos = Util.getEventPosition(e, this._target, this._scale, this._zoom);

		/* Stop propagation if inside canvas area */
		if ((pos.realx >= 0) && (pos.realy >= 0) &&
			(pos.realx < this._target.offsetWidth) &&
			(pos.realy < this._target.offsetHeight)) {

			Util.stopEvent(e);
			return false;
		}

		return true;
	},

	// Public methods

	grab: function () {
		debugmouse('grab()');

		var c = this._target;
		var isTouch = 'ontouchstart' in document.documentElement;

		if (isTouch) {
			Util.addEvent(c, 'touchstart', this._eventHandlers.mousedown);
			Util.addEvent(global, 'touchend', this._eventHandlers.mouseup);
			Util.addEvent(c, 'touchend', this._eventHandlers.mouseup);
			Util.addEvent(c, 'touchmove', this._eventHandlers.mousemove);
		}

		if (!isTouch || this._enableMouseAndTouch) {
			Util.addEvent(c, 'mousedown', this._eventHandlers.mousedown);
			Util.addEvent(global, 'mouseup', this._eventHandlers.mouseup);
			Util.addEvent(c, 'mouseup', this._eventHandlers.mouseup);
			Util.addEvent(c, 'mousemove', this._eventHandlers.mousemove);
			Util.addEvent(c, (browser.gecko) ? 'DOMMouseScroll' : 'mousewheel',
						  this._eventHandlers.mousewheel);
		}

		/* Work around right and middle click browser behaviors */
		Util.addEvent(document, 'click', this._eventHandlers.mousedisable);
		Util.addEvent(document.body, 'contextmenu', this._eventHandlers.mousedisable);
	},

	ungrab: function () {
		debugmouse('ungrab()');

		var c = this._target;
		var isTouch = 'ontouchstart' in document.documentElement;

		if (isTouch) {
			Util.removeEvent(c, 'touchstart', this._eventHandlers.mousedown);
			Util.removeEvent(global, 'touchend', this._eventHandlers.mouseup);
			Util.removeEvent(c, 'touchend', this._eventHandlers.mouseup);
			Util.removeEvent(c, 'touchmove', this._eventHandlers.mousemove);
		}

		if (!isTouch || this._enableMouseAndTouch) {
			Util.removeEvent(c, 'mousedown', this._eventHandlers.mousedown);
			Util.removeEvent(global, 'mouseup', this._eventHandlers.mouseup);
			Util.removeEvent(c, 'mouseup', this._eventHandlers.mouseup);
			Util.removeEvent(c, 'mousemove', this._eventHandlers.mousemove);
			Util.removeEvent(c, (browser.gecko) ? 'DOMMouseScroll' : 'mousewheel',
							 this._eventHandlers.mousewheel);
		}

		/* Work around right and middle click browser behaviors */
		Util.removeEvent(document, 'click', this._eventHandlers.mousedisable);
		Util.removeEvent(document.body, 'contextmenu', this._eventHandlers.mousedisable);

	}
};


Util.make_properties(Mouse, [
	['target',         'ro', 'dom'],   // DOM element that captures mouse input
	['notify',         'ro', 'func'],  // Function to call to notify whenever a mouse event is received
	['focused',        'rw', 'bool'],  // Capture and send mouse clicks/movement
	['scale',          'rw', 'float'], // Viewport scale factor 0.0 - 1.0
	['zoom',           'rw', 'float'], // CSS zoom applied to the DOM element that captures mouse input
	['enableMouseAndTouch', 'rw', 'bool'],  // Whether also enable mouse events when touch screen is detected

	['onMouseButton',  'rw', 'func'],  // Handler for mouse button click/release
	['onMouseMove',    'rw', 'func'],  // Handler for mouse movement
	['touchButton',    'rw', 'int']    // Button mask (1, 2, 4) for touch devices (0 means ignore clicks)
]);


/**
 * Add Keyboard and Mouse in the exposed Object.
 */
Input.Keyboard = Keyboard;
Input.Mouse = Mouse;
