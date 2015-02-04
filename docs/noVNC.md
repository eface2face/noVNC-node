# `noVNC` module API

The library exportes the `noVNC` module/Object which has the following items:

* `Util`
* `Keys`
* `KbdUtil`
* `Input`
* `Websock`
* `Base64`
* `DES`
* `TINF`
* `Display`
* `RFB`

The API of all these modules has been modified in order to make it Node/browserify aware. Some functions have been merged into modules (to avoid globals), some others have been removed.


## `Util` module

Based on the original [util.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/util.js).

### API

* `push8(array, num)`
* `push16(array, num)`
* `push32(array, num)`
  * (note that the above functions have modified and require the Array to be passed as argument)
* `requestAnimFrame()`
* `make_properties()`
* `set_defaults()`
* `decodeUTF8()`
* `getPosition()`
* `getEventPosition()`
* `addEvent()`
* `removeEvent()`
* `stopEvent()`


## `Keys` module

Based on both the original [keysym.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/keysym.js) and [keysymdef.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/keysymdef.js). It combined both.

### API

* `XK_XXXXX` (all the key values)
* `lookup(k)`
* `fromUnicode(u)`


## `KbdUtil` module

Based on the original [keyboard.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/keyboard.js).

### API

* `hasShortcutModifier()`
* `hasCharModifier()`
* `ModifierSync()`
* `getKey()`
* `getKeysym()`
* `keysymFromKeyCode()`
* `nonCharacterKey()`
* `substituteCodepoint()`
* `KeyEventDecoder()`
* `VerifyCharModifier()`
* `TrackKeyState()`
* `EscapeModifiers()`


## `Input` module

Based on the original [input.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/input.js).

### API

* `Keyboard` class
  * `grab()`
  * `ungrab()`
  * `sync()`
* `Mouse` class
  * `grab()`
  * `ungrab()`


## `Websock` class

Based on the original [websock.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/websock.js).

### API

Same as the original.


## `Base64` module

Based on the original [base64.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/base64.js).

### API

Same as the original.


## `DES` function

Based on the original [des.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/des.js).

### API

Same as the original.


## `TINF` class

Based on the original `TINF` class defined in [jsunzip.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/jsunzip.js).

### API

Same as the original.


## `Display` class

Based on the original [display.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/display.js).

### API

Same as the original.


## `RFB` class

Based on the original [rfb.js](https://github.com/kanaka/noVNC/blob/v0.5.1/include/rfb.js).

### API

Same as the original.
