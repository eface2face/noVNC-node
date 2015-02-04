
var antiglobal = require('antiglobal');

// Load noVNC now.
require('../');


module.exports = {
	/**
	 * Ensure that, after loading noVNC, there are no globals.
	 */
	'should not be globals': function(test) {
		test.ok(antiglobal());
		test.done();
	}
};
