const fs = require('fs');
const path = require('path');
const JSLIB = 'js/jslib/';

function copy(lib, dest) {
	var input = fs.createReadStream(path.join('node_modules', lib));
	var output = fs.createWriteStream(path.join(dest, path.basename(lib)));
	input.pipe(output);
}

try {
	fs.mkdirSync(JSLIB);
} catch (err) {
  // ignore
}

copy('highcharts/highcharts.js', JSLIB);
copy('highcharts/themes/sand-signika.js', JSLIB);
copy('moment/moment.js', JSLIB);
copy('requirejs-text/text.js', JSLIB);
