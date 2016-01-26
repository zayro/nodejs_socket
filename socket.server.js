
var colors = require('colors');
var express = require('express');
var http = require('http');
var ejs = require('ejs');
var ip = require('ip');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);



console.log("bienvenido al WEBZAV");

var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('inicio puerto del servidor %d', port);
});

// Routing
app.use(express.static(__dirname + '/public_html'));

// puerto de conexion
//server.listen(5000);


// routing
//app.get('/', function (req, res) {   res.sendfile(__dirname + 'public_html/index.html'); });



// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
//var rooms = ['principal','room2','room3'];
var rooms = [];





io.sockets.on('connection', function (socket) {



	// when the client emits 'agregar', this listens and executes
	socket.on('agregar', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'principal';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room
		socket.join('principal');
		// echo to client they've connected
		socket.emit('actualizar', 'SERVIDOR', 'se ha conectado al sistema principal');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('principal').emit('actualizar', 'SERVIDOR', username + ' has connected to this room');

		socket.emit('sala', rooms, 'principal');


	console.log('se ha conectado  : '+socket.username.green+' con la ip'+ socket.handshake.address+' al sistema: '+socket.room.green );

	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('EnviarMensaje', function (data) {
		// we tell the client to execute 'actualizar' with 2 parameters
		io.sockets.in(socket.room).emit('actualizar', socket.username, data);
	});

	socket.on('CambiarSala', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('actualizar', 'SERVIDOR', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('actualizar', 'SERVIDOR', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('actualizar', 'SERVIDOR', socket.username+' has joined this room');
		socket.emit('sala', rooms, newroom);

    console.log('se ha cambiado usuario: '+socket.username.yellow+'  al sistema : '+socket.room.yellow );
	});


	// when the user disconnects.. perform this
	socket.on('disconnect', function(){

		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('actualizar', 'SERVIDOR', socket.username + ' has disconnected');

    console.log('se ha '+'desconectado'.red+' al sistema : '+socket.username);

    // end room
		socket.leave(socket.room);


	});
});

io.set('transports', ['websocket',
                  'flashsocket',
                  'htmlfile',
                  'xhr-polling',
                  'jsonp-polling',
                  'polling']);
io.set("polling duration", 10);

io.listen(server);
