var DES = require('../').DES;


function genDES (password, challenge) {
	var passwd = [];
	for (var i = 0; i < password.length; i++) {
		passwd.push(password.charCodeAt(i));
	}
	return (new DES(passwd)).encrypt(challenge);
}


module.exports = {
	'DES should work': function(test) {
		test.deepEqual(
			[181,75,21,234,243,160,78,4,44,160,233,94,64,30,39,189],
			genDES('blah', [1,2,34])
		);

		test.deepEqual(
			[19, 108, 177, 42, 153, 58, 140, 68, 226, 190, 15, 107, 155, 223, 77, 3],
			genDES('foo', [2,3,35])
		);

		test.deepEqual(
			[181,75,21,234,243,160,78,4,44,160,233,94,64,30,39,189],
			genDES('blah', [1,2,34])
		);

		test.done();
	}
};
