module.exports = function(config) {
  var basedir = "../../../../";
  var tests = "../tests/";
  var core = "target/unpacked-core/geoladris/core/";

	config.set({
	  basePath : basedir,
		frameworks : [ 'jasmine', 'requirejs' ],
		files : [ tests + 'test-main.js', tests + 'geoladris-tests.js', core + 'jslib/jquery-2.1.0.js', //
		{
			pattern : core + 'modules/message-bus.js',
			included : false
		}, {
			pattern : 'node_modules/squirejs/**/*.js',
			included : false
		}, {
			pattern : 'src/main/resources/geoladris/*/modules/**/*.js',
			included : false
		}, {
			pattern : 'src/main/resources/geoladris/*/jslib/**/*.js',
			included : false
		}, {
			pattern : 'src/test/resources/js/**/*.js',
			included : false
		}, ],
		
		reporters : [ 'progress', 'junit', 'coverage' ],
		port : 9876,
		logLevel : config.LOG_INFO,
		browsers : [ 'PhantomJS' ],
		plugins : [ 'karma-jasmine', 'karma-junit-reporter', 'karma-requirejs', 'karma-phantomjs-launcher', 'karma-coverage' ],
		singleRun : true,
		colors : true,
		autoWatch : false,
		preprocessors : {
			'src/main/resources/geoladris/*/modules/**/*.js' : [ 'coverage' ]
		},
		junitReporter : {
			outputFile : 'target/reports/junit/TESTS-xunit.xml',
			useBrowserName : false
		},
		coverageReporter : {
			type : 'lcov',
			dir : 'target',
			subdir : "js-coverage"
		}
	});
};
