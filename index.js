const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const request = require('request');
const loadYaml = require('./lib/loadYaml');
const FileBrowser = require('./lib/FileBrowser');


function FlightProxyn(options) {
	this.options = options || {};
	if (this.options.config) {
		this.config = loadYaml(this.options.config);
	} else {
		this.config = loadYaml(getConfigPath());
	}

	this.browser = new FileBrowser(this.config.search_path);

	if (this.config === null) {
		console.log("config file not exits in current directory");
		process.exit(1);
	}

	this._onRequest = onRequest.bind(this);
}

FlightProxyn.prototype.createProxy = function (server) {
	if (!server) server = http.createServer();

	server.on('request', this._onRequest);

	this.server = server;

	return server;
}

FlightProxyn.prototype.listen = function () {
	if (!this.server) {
		this.createProxy();
	}

	var args = Array.prototype.slice.call(arguments);

	return this.server.listen.apply(this.server, args);
}

FlightProxyn.prototype.requestLocal = function (req, res) {
	var parsed = url.parse(req.url);
	var filePath = removeHash(parsed.path);
	var found = this.browser.search(filePath);
	if (found && found.isFile()) {
		var mimeType = mime.lookup(found.path());
		res.setHeader('Content-Type', mimeType);
		return getStaticFile(found.path());
	}
	return null;
}

FlightProxyn.prototype.requestRemote = function (req, res, cb) {
	var parsed = url.parse(req.url);
	var request_url = url.resolve(this.config.remote_url, parsed.path);
	console.log(request_url);

	request(request_url, {
		timeout: 8500
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			cb(body);
		} else {
			cb(null);
		}
	})
}

FlightProxyn.prototype.run = function () {
	this.listen(this.options.port, function () {
		console.log('flight-proxyn is running at :' + this.options.port);
	}.bind(this));
}

function getStaticFile(file, err_cb) {
	try {
		return fs.readFileSync(file, 'utf8');
	} catch (e) {
		console.log(e);
		return null;
	}
}

function onRequest(req, res) {
	var content = this.requestLocal(req, res);
	if (!content) {
		this.requestRemote(req, res, function (body) {
			if (body === null) {
				res.writeHead(404);
				res.end();
				return;
			}
			res.end(body);
		});
	} else {
		// const acceptTypes = 
		res.writeHead(200);
		res.end(content);	
	}
}


module.exports = function (options) {
	return new FlightProxyn(options);
}


function getConfigPath() {
	var curr = path.dirname(__filename);
	return path.join(curr, 'proxy.yml');
}


/**
 * Suppose the path is /assets/css/main-bundle-$wfwoOI2djo$.css
 * url must contains a -ms- part.
 * we need remove the hash part to get the clean file name. main-bundle.css
 */
function removeHash(url) {
	if (url.indexOf('-ms-') === -1) {
		return url;
	}

	var basename = path.basename(url);
	var filename = basename.substr(0, basename.length - path.extname(url).length);
	
	var lastIndexOfDash = filename.lastIndexOf('-ms-');

	var filenameWithoutDot = filename.substr(0, lastIndexOfDash);

	return path.join(path.dirname(url), filenameWithoutDot + path.extname(url));
}


// running
if (require.main === module) {
	var flight = new FlightProxyn();

	flight.listen(3456, function () {
		console.log('flight-proxyn is running at :' + 3456);
	})
}
