var express = require('express'), 
    http = require('http'), 
    path = require('path')
    io = require('socket.io'),
    twilio = require('twilio');

// Express configuration boilerplate
var app = express();
app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.use(express.static(path.join(__dirname, 'public')));
});
app.configure('development', function() {
    app.use(express.errorHandler());
});

// Create a route to return a capability token with a client name
app.get('/token', function(request, response) {
    var capability = new twilio.Capability();
    capability.allowClientIncoming(request.query.clientName);
    capability.allowClientOutgoing('AP3f9a303453eef05f25e7720e5429e2e6');
    response.send(capability.generate());
});

// Set up express server
var server = http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

// Set up socket.io
var io = require('socket.io').listen(server);

io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});

// Handle socket traffic
io.sockets.on('connection', function (socket) {
    // Relay chat data to all clients
	socket.on('editorUpdate', function(data) {
		socket.broadcast.emit('editorUpdate', data);
	});
});