"use strict";

var cache = require('memory-cache');
var request = require('request');
var jsdom = require('jsdom');
var Timetable = require('../model/timetable.js');
var _ = require('lodash');

module.exports = function(app) {
	app.get('/timetable', function(req, res, next) {
		var studentId = req.query.studentId;

		if (typeof studentId !== 'undefined' && studentId !== null) {
			res.redirect('/timetable/' + studentId);
		} else {
			next();
		}
	});

	function continueRequestWithTimetable(res, timetable) {
		res.render('timetable-parsing', {
			title: 'Parsing timetable...',
			'studentId': timetable.studentId
		});
	};

	app.get('/timetable/[u|U]:studentId.ics', function(req, res) {
		res.redirect(`/timetable/${req.params.studentId}.ics`);
	});

	app.get('/timetable/:studentId.ics', function(req, res) {
		var studentId = req.params.studentId;
		var doAddAlarms = req.query['addAlarms'];
		if (typeof doAddAlarms === 'undefined') {
			doAddAlarms = true;
		} else {
			if (doAddAlarms === 'true') {
				doAddAlarms = true;
			} else if (doAddAlarms === 'false') {
				doAddAlarms = false;
			} else {
				res.render('errors/400', {
					error: 'doAddAlarms must be a boolean'
				});
				return;
			}
		}

		var alarmOffset = req.query['alarmOffset'];
		if (typeof alarmOffset === 'undefined') {
			alarmOffset = -30;
		} else {
			alarmOffset = parseInt(alarmOffset, 10);
			if (isNaN(alarmOffset)) {
				res.render('errors/400', {
					error: 'alarmOffset must be an integer'
				});
				return;
	 		}
 		}

		function sendTimetable(timetable) {
			if (timetable.error === null) {
				var calendarValue = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:joseph-duffy-timetable-parser`;

				var previousEntryEndDate = null;
				_.forEach(timetable.orderedEntries(), function(entry) {
					calendarValue = `${calendarValue}
${entry.iCalRepresentation(previousEntryEndDate, doAddAlarms, alarmOffset)}`;
					previousEntryEndDate = entry.endTime;
				});

				calendarValue = `${calendarValue}
END:VCALENDAR`;

				res.header('Content-Type', 'text/calendar;charset=UTF-8');
				res.send(calendarValue.replace(/\n/g, "\r\n"));
			} else {
				res.status(404);
				res.render('errors/404');
			}
		}

		let timetable = cache.get(`timetable-${studentId}`);
		if (timetable !== null) {
			if (timetable.finished()) {
				sendTimetable(timetable);
			} else {
				timetable.on('finish', function() {
					sendTimetable(timetable);
				});
			}
		} else {
			let timetable = new Timetable(studentId);
			cache.put(`timetable-${studentId}`, timetable);

			timetable.on('finish', function() {
				sendTimetable(timetable);
			});

			timetable.beginParsing();
		}
	});

	app.get('/timetable/[u|U]:studentId', function(req, res) {
		res.redirect(`/timetable/${req.params.studentId}`);
	});

	app.get('/timetable/:studentId', function(req, res) {
		var studentId = req.params.studentId;

		let addAlarmsDefault = true;
		let alarmOffsetDefault = -30;

		var queryString = "";

		var addAlarms = req.query['addAlarms'];
		if (typeof addAlarms === 'undefined') {
			addAlarms = addAlarmsDefault;
		} else {
			if (addAlarms === 'false') {
				addAlarms = false;
			} else {
				addAlarms = true;
			}

			if (addAlarms !== addAlarmsDefault) {
				queryString += `?addAlarms=${addAlarms}`
			}
		}

		var alarmOffset = req.query['alarmOffset'];
		if (typeof alarmOffset === 'undefined') {
			alarmOffset = alarmOffsetDefault;
		} else {
			alarmOffset = parseInt(alarmOffset, 10);
			if (isNaN(alarmOffset)) {
				alarmOffset = alarmOffsetDefault;
	 		}

			 if (addAlarms && alarmOffset !== alarmOffsetDefault) {
				if (queryString.length == 0) {
					queryString += "?";
				} else {
					queryString += "&";
				}

				queryString += `alarmOffset=${alarmOffset}`;
			 }
 		}

		let timetable = cache.get(`timetable-${studentId}`);
		if (timetable !== null) {
			if (timetable.error) {
				res.render('timetable-error', {
					title: 'Timetable Error',
					errorMessage: timetable.error
				});
			} else if (timetable.finished()) {
				res.render('timetable-completed', {
					title: `Timetable for ${studentId}`,
					baseTimetableURL: `${req.get('host')}/timetable/${studentId}.ics`,
					timetableURL: `${req.get('host')}/timetable/${studentId}.ics${queryString}`,
					entries: timetable.orderedEntries(),
					addAlarms: addAlarms,
					alarmOffset: alarmOffset,
					studentId: studentId,
					addAlarmsDefault: addAlarmsDefault,
					alarmOffsetDefault: alarmOffsetDefault,
					urlProtocol: req.protocol
				});
			} else {
				continueRequestWithTimetable(res, timetable);
			}
		} else {
			let timetable = new Timetable(studentId);
			cache.put(`timetable-${studentId}`, timetable);
			timetable.beginParsing();

			continueRequestWithTimetable(res, timetable);
		}
	});
};