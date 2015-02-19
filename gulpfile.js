/**
 * Dependencies.
 */
var gulp = require('gulp');
var browserify = require('browserify');
var vinyl_transform = require('vinyl-transform');
var jshint = require('gulp-jshint');
var filelog = require('gulp-filelog');
var expect = require('gulp-expect-file');
var rename = require('gulp-rename');
var header = require('gulp-header');
var nodeunit = require('gulp-nodeunit-runner');
var fs = require('fs');
var pkg = require('./package.json');


// Banner.
var banner = fs.readFileSync('banner.txt').toString();

// gulp-expect-file options.
var expectOptions = {
	silent: true,
	errorOnFailure: true,
	checkRealFile: true
};


gulp.task('lint', function() {
	var src = ['gulpfile.js', 'lib/**/*.js', 'test/**/*.js'];
	return gulp.src(src)
		.pipe(filelog('lint'))
		.pipe(expect(expectOptions, src))
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish', {verbose: true}))
		.pipe(jshint.reporter('fail'));
});


gulp.task('test', function() {
	var src = 'test/*.js';
	return gulp.src(src)
		.pipe(filelog('test'))
		.pipe(expect(expectOptions, src))
		.pipe(nodeunit({reporter: 'default'}));
});


gulp.task('browserify', function() {
	var browserified = vinyl_transform(function(filename) {
		var b = browserify(filename, {
			standalone: 'noVNC'
		});
		return b.bundle();
	});

	var src = pkg.main;
	return gulp.src(src)
		.pipe(filelog('browserify'))
		.pipe(expect(expectOptions, src))
		.pipe(browserified)
		.pipe(header(banner, {pkg: pkg}))
		.pipe(rename(pkg.name + '-' + pkg.version + '.js'))
		.pipe(gulp.dest('dist/'));
});


gulp.task('copy', function() {
	var src = 'dist/' + pkg.name + '-' + pkg.version + '.js';
	return gulp.src(src)
		.pipe(filelog('copy'))
		.pipe(expect(expectOptions, src))
		.pipe(rename(pkg.name + '.js'))
		.pipe(gulp.dest('dist/'));
});


gulp.task('devel', gulp.series('lint', 'test'));
gulp.task('dist', gulp.series('lint', 'test', 'browserify', 'copy'));


gulp.task('default', gulp.series('devel'));
