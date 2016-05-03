const http = require('http');
const url = require('url');
const path = require('path');
const loadYaml = require('./lib/loadYaml');

function FlightProxyn(options) {
	this.config = loadYaml(getConfigPath());
	this.options = options || {};

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

function onRequest(req, res) {
	const parsedUrl = url.parse(req.url);
	
	res.writeHead(200);
	res.end("OK");
}


module.exports = function (options) {
	return new FlightProxyn(options);
}


function getConfigPath() {
	var curr = path.dirname(__filename);
	return path.join(curr, 'proxy.yml');
}


// running
if (require.main === module) {
	var flight = new FlightProxyn();

	flight.listen(3456, function () {
		console.log('flight-proxyn is running at :' + 3456);
	})
}
