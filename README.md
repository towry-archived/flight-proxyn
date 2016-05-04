# flight proxyn

server the static behind a proxy. 

This project is used to map some resource url to local, the map pattern is like
`app-ms-oOdj2ofjJOf.css` to local `app.css`.

```
npm install flight-proxyn

var FlightProxy = require('flight-proxyn');
var flight = FlightProxy({port: 3456, config: {remote_url: "http://...", search_path: "...."}});
flight.run();
```

