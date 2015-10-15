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
			title: 'Parsing timetable',
			'studentId': timetable.studentId
		});
	};

	app.get('/timetable/:studentId', function(req, res) {
		var studentId = req.params.studentId;

		let timetable = cache.get(`timetable-${studentId}`);
		if (timetable !== null) {
			if (timetable.finished()) {
				console.log(timetable.entries);
				let orderedEntries = _.sortByAll(timetable.entries, ['date', 'startTime']);
				console.log(orderedEntries);
				res.render('timetable-completed', {
					title: 'Timetable Completed',
					studentId: studentId,
					entries: orderedEntries
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