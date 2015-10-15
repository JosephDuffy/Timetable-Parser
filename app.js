"use strict";

var express = require('express');
var app = express();
var hbs = require('express-hbs');
var io = require('socket.io')();
var cache = require('memory-cache');

app.set('io', io);
app.engine('hbs', hbs.express4());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
	res.render('index', {
		title: 'University of Huddersfield Timetable Parser'
	});
});

require('./routes/timetable')(app);

io.on('connection', function(socket) {
	socket.on('error', function(err) {
		console.error(`Had an error: ${err}`);
	});

	socket.on('studentId', function(studentId) {
		function loadedTimetable(timetable) {
			if (timetable.finished()) {
				socket.emit('finish', '/timetable/' + timetable.studentId);
				return;
			}

			timetable.on('error', function(err) {
				socket.emit('error', err);
			});

			timetable.messages.forEach(function(message) {
				socket.emit('addMessage', message);
			});

			timetable.on('addMessage', function(message) {
				socket.emit('addMessage', message);
			});

			timetable.on('finish', function() {
				socket.emit('finish', '/timetable/' + timetable.studentId);
			});
		};

		let timetable = cache.get(`timetable-${studentId}`);
		if (timetable !== null) {
			loadedTimetable(timetable);
		} else {
			socket.emit('error', 'Unknown student id');
		}
	});
});

var server = app.listen(3000, function () {
	io.attach(server);

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});