/**
 * Declare some globals.
 */
global.window = global;
global.document = {};


var antiglobal = require('antiglobal');
// Load noVNC now.
require('../');


// antiglobal.log = false;


module.exports = {
	'should not be globals': function(test) {
		test.ok(antiglobal());
		test.done();
	}
};
