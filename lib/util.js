/**
 * Dependencies.
 */
var debugerror = require('debug')('noVNC:ERROR:Util');
debugerror.log = console.warn.bind(console);


var Util = module.exports = {
	push8: function (array, num) {
		array.push(num & 0xFF);
	},

	push16: function (array, num) {
		array.push((num >> 8) & 0xFF,
				    num & 0xFF);
	},

	push32: function (array, num) {
		array.push((num >> 24) & 0xFF,
				   (num >> 16) & 0xFF,
				   (num >> 8) & 0xFF,
				   num & 0xFF);
	},

	requestAnimFrame: (function () {
		return  global.requestAnimationFrame       ||
				global.webkitRequestAnimationFrame ||
				global.mozRequestAnimationFrame    ||
				global.oRequestAnimationFrame      ||
				global.msRequestAnimationFrame     ||
				function(callback) {
					setTimeout(callback, 1000 / 60);
				};
	})(),

	make_properties: function (constructor, arr) {
		for (var i = 0; i < arr.length; i++) {
			make_property(constructor.prototype, arr[i][0], arr[i][1], arr[i][2]);
		}
	},

	set_defaults: function (obj, conf, defaults) {
		var defaults_keys = Object.keys(defaults);
		var conf_keys = Object.keys(conf);
		var keys_obj = {};
		var i;

		for (i = 0; i < defaults_keys.length; i++) { keys_obj[defaults_keys[i]] = 1; }
		for (i = 0; i < conf_keys.length; i++) { keys_obj[conf_keys[i]] = 1; }

		var keys = Object.keys(keys_obj);

		for (i = 0; i < keys.length; i++) {
			var setter = obj['_raw_set_' + keys[i]];

			if (!setter) {
				debugerror('invalid property: %s', keys[i]);
				continue;
			}

			if (keys[i] in conf) {
				setter.call(obj, conf[keys[i]]);
			} else {
				setter.call(obj, defaults[keys[i]]);
			}
		}
	},

	decodeUTF8: function (utf8string) {
		return decodeURIComponent(escape(utf8string));
	},

	/**
	 * Get DOM element position on page.
	 * TODO: Just used in ui.js, which is not included. Remove this.
	 */
	getPosition: (function () {
		function getStyle(obj, styleProp) {
			var y;

			if (obj.currentStyle) {
				y = obj.currentStyle[styleProp];
			} else if (global.getComputedStyle) {
				y = global.getComputedStyle(obj, null)[styleProp];
			}
			return y;
		}

		function scrollDist() {
			var myScrollTop = 0, myScrollLeft = 0;
			var html = document.getElementsByTagName('html')[0];

			// get the scrollTop part
			if (html.scrollTop && document.documentElement.scrollTop) {
				myScrollTop = html.scrollTop;
			} else if (html.scrollTop || document.documentElement.scrollTop) {
				myScrollTop = html.scrollTop + document.documentElement.scrollTop;
			} else if (document.body.scrollTop) {
				myScrollTop = document.body.scrollTop;
			} else {
				myScrollTop = 0;
			}

			// get the scrollLeft part
			if (html.scrollLeft && document.documentElement.scrollLeft) {
				myScrollLeft = html.scrollLeft;
			} else if (html.scrollLeft || document.documentElement.scrollLeft) {
				myScrollLeft = html.scrollLeft + document.documentElement.scrollLeft;
			} else if (document.body.scrollLeft) {
				myScrollLeft = document.body.scrollLeft;
			} else {
				myScrollLeft = 0;
			}

			return [myScrollLeft, myScrollTop];
		}

		return function (obj) {
			var curleft = 0, curtop = 0, scr = obj, fixed = false;

			while ((scr = scr.parentNode) && scr !== document.body) {
				curleft -= scr.scrollLeft || 0;
				curtop -= scr.scrollTop || 0;
				if (getStyle(scr, 'position') === 'fixed') {
					fixed = true;
				}
			}
			// NOTE: New Opera uses Chrome engine.
			//if (fixed && !global.opera) {
			if (fixed) {
				var scrDist = scrollDist();
				curleft += scrDist[0];
				curtop += scrDist[1];
			}

			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while ((obj = obj.offsetParent));

			return {'x': curleft, 'y': curtop};
		};
	})(),

	/**
	 * Get mouse event position in DOM element
	 */
	getEventPosition: function (e, obj, scale) {
		var evt, docX, docY, pos;

		evt = (e ? e : global.event);
		evt = (evt.changedTouches ? evt.changedTouches[0] : evt.touches ? evt.touches[0] : evt);
		if (evt.pageX || evt.pageY) {
			docX = evt.pageX;
			docY = evt.pageY;
		} else if (evt.clientX || evt.clientY) {
			docX = evt.clientX + document.body.scrollLeft +
				document.documentElement.scrollLeft;
			docY = evt.clientY + document.body.scrollTop +
				document.documentElement.scrollTop;
		}
		pos = Util.getPosition(obj);
		if (typeof scale === 'undefined') {
			scale = 1;
		}

		var realx = docX - pos.x;
		var realy = docY - pos.y;
		var x = Math.max(Math.min(realx, obj.width - 1), 0);
		var y = Math.max(Math.min(realy, obj.height - 1), 0);

		return {'x': x / scale, 'y': y / scale, 'realx': realx / scale, 'realy': realy / scale};
	},

	addEvent: function (obj, evType, fn) {
		if (obj.attachEvent) {
			var r = obj.attachEvent('on' + evType, fn);
			return r;
		} else if (obj.addEventListener) {
			obj.addEventListener(evType, fn, false);
			return true;
		} else {
			throw new Error('handler could not be attached');
		}
	},

	removeEvent: function (obj, evType, fn) {
		if (obj.detachEvent) {
			var r = obj.detachEvent('on' + evType, fn);
			return r;
		} else if (obj.removeEventListener) {
			obj.removeEventListener(evType, fn, false);
			return true;
		} else {
			throw new Error('handler could not be removed');
		}
	},

	stopEvent: function (e) {
		if (e.stopPropagation) { e.stopPropagation(); }
		else                   { e.cancelBubble = true; }

		if (e.preventDefault)  { e.preventDefault(); }
		else                   { e.returnValue = false; }
	}
};


/**
 * Private API.
 */


function make_property (proto, name, mode, type) {
	var getter;

	if (type === 'arr') {
		getter = function (idx) {
			if (typeof idx !== 'undefined') {
				return this['_' + name][idx];
			} else {
				return this['_' + name];
			}
		};
	} else {
		getter = function() {
			return this['_' + name];
		};
	}

	function make_setter (process_val) {
		if (process_val) {
			return function (val, idx) {
				if (typeof idx !== 'undefined') {
					this['_' + name][idx] = process_val(val);
				} else {
					this['_' + name] = process_val(val);
				}
			};
		} else {
			return function (val, idx) {
				if (typeof idx !== 'undefined') {
					this['_' + name][idx] = val;
				} else {
					this['_' + name] = val;
				}
			};
		}
	}

	var setter;

	if (type === 'bool') {
		setter = make_setter(function (val) {
			if (!val || (val in {'0': 1, 'no': 1, 'false': 1})) {
				return false;
			} else {
				return true;
			}
		});
	} else if (type === 'int') {
		setter = make_setter(function (val) { return parseInt(val, 10); });
	} else if (type === 'float') {
		setter = make_setter(parseFloat);
	} else if (type === 'str') {
		setter = make_setter(String);
	} else if (type === 'func') {
		setter = make_setter(function (val) {
			if (!val) {
				return function () {};
			} else {
				return val;
			}
		});
	} else if (type === 'arr' || type === 'dom' || type === 'raw') {
		setter = make_setter();
	} else {
		throw new Error('unknown property type ' + type);  // some sanity checking
	}

	// set the getter
	if (typeof proto['get_' + name] === 'undefined') {
		proto['get_' + name] = getter;
	}

	// set the setter if needed
	if (typeof proto['set_' + name] === 'undefined') {
		if (mode === 'rw') {
			proto['set_' + name] = setter;
		} else if (mode === 'wo') {
			proto['set_' + name] = function (val, idx) {
				if (typeof this['_' + name] !== 'undefined') {
					throw new Error(name + ' can only be set once');
				}
				setter.call(this, val, idx);
			};
		}
	}

	// make a special setter that we can use in set defaults
	proto['_raw_set_' + name] = function (val, idx) {
		setter.call(this, val, idx);
		//delete this['_init_set_' + name];  // remove it after use
	};
}
