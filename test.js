var FlightProxyn = require('./');

var flight = FlightProxyn({
	port: 3456,
	config: './proxy.yml'
});

flight.run();
