"use strict";

var request = require('request');
var jsdom = require('jsdom').jsdom;
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var _ = require('lodash');
var TimetableEntry = require('./TimetableEntry');

var Timetable = function(studentId) {
	this.studentId = studentId;
	this.completedTimestamp = null;
	this.isParsing = false;
	this.messages = [];
	this.entries = [];
	this.error = null;
};

util.inherits(Timetable, EventEmitter);

Timetable.prototype.orderedEntries = function() {
	return _.sortBy(this.entries, 'startTime');
};

Timetable.prototype.finished = function() {
	return this.completedTimestamp !== null;
};

Timetable.prototype.finish = function(error) {
	this.completedTimestamp = new Date();
	this.isParsing = true;
	if (typeof error !== 'undefined' && error !== null) {
		this.error = error;
		this.emit('addErrorMessage', error);
	}

	this.emit('finish');
};

Timetable.prototype.addMessage = function(message) {
	this.messages.push(message);
	this.emit('addMessage', message);
};

Timetable.prototype.getDataForWeek = function(week, viewState, viewStateGenerator, eventValidation, callback) {
	let self = this;
	this.messages.push(`Getting data for week ${week}`);

	request.post('https://mytimetable.hud.ac.uk/schedule_S.aspx', {
			form: {
				'ctl00$ContentPlaceHolder1$HF_stuNum': self.studentId,
				'ctl00$ContentPlaceHolder1$ddlWeeks': week,
				'__EVENTTARGET': 'ctl00$ContentPlaceHolder1$ddlWeeks',
				'ctl00$ScriptManager1': 'ctl00$ContentPlaceHolder1$UpdatePanel1|ctl00$ContentPlaceHolder1$ddlWeeks',
				'__EVENTVALIDATION': eventValidation,
				'__VIEWSTATEGENERATOR': viewStateGenerator,
				'__VIEWSTATE': viewState
			}
		}, function(err, httpResponse, body) {
			if (err) {
				self.emit('error', err);
			} else {
				jsdom.env(
					body,
					function (err, window) {
						if (err) {
							self.emit('error', err);
						} else {
							let tableContainer = window.document.getElementById('ctl00_ContentPlaceHolder1_Schedule1');
							if (tableContainer !== null) {
								let table = tableContainer.firstChild;
								self.parseTimetableHTML(table, week, callback);
							}
						}
					}
				);

			}
		});
};

Timetable.prototype.parseTimetableHTML = function(table, date, callback) {
	let self = this;

	this.addMessage(`Getting data for week ${date}`);

	let rows = table.tBodies[0].rows;
	let rowsCount = rows.length;
	if (rowsCount == 7) {
		// Start at 2 because the first row has all of the times in and
		// the seonc row has nothing (just for layout reasons I guess)
		// Yey for semantics :)
		for (var i = 2; i < 7; i++) {
			let row = rows[i];

			let daysOffset = i - 2;
			let baseDate = new Date(date);
			baseDate.setDate(baseDate.getDate() + daysOffset);

			let lectures = row.getElementsByClassName('lect');
			let practicals = row.getElementsByClassName('prac');

			if (lectures.length == 1) {
				this.addMessage(`Found 1 lecture in week beginning ${date}`);
			} else {
				this.addMessage(`Found ${lectures.length} lectures in week beginning ${date}`);
			}

			if (practicals.length == 1) {
				this.addMessage(`Found 1 practical in week beginning ${date}`);
			} else {
				this.addMessage(`Found ${practicals.length} practicals in week beginning ${date}`);
			}

			function parseEntries(entries, entryType) {
				_.forEach(entries, function(entrie) {
					let containingSpan = entrie.firstChild;
					var textNodeIndex = 0;

					var startTime, endTime, moduleCode, moduleName, room, lecturer;

					_.forEach(containingSpan.childNodes, function(childNode) {
						if (childNode.nodeType == childNode.TEXT_NODE) {
							let textValue = childNode.nodeValue.trim();

							switch (textNodeIndex) {
							case 0:
								// Time
								let timesString = textValue.split(', ')[1];
								let timeValues = timesString.split(' - ');
								let startTimeString = timeValues[0];
								let endTimeString = timeValues[1];

								startTime = new Date(baseDate.getTime());
								let startTimeParts = startTimeString.split(':');
								startTime.setHours(startTimeParts[0], startTimeParts[1]);

								endTime = new Date(baseDate.getTime());
								let endTimeParts = endTimeString.split(':');
								endTime.setHours(endTimeParts[0], endTimeParts[1]);

								break;
							case 1:
								// Module code
								moduleCode = textValue.substring('Module: '.length);
								break;
							case 2:
								// Module name
								moduleName = textValue;
								break;
							case 3:
								// Room
								room = textValue.substring('Room: '.length);
								break;
							case 4:
								// Lecturer
								lecturer = textValue;
								break;
							}

							textNodeIndex++;
						}
					});

					let entry = new TimetableEntry(self.studentId, entryType, startTime, endTime, moduleCode, moduleName, room, lecturer);
					self.entries.push(entry);
				});
			};

			parseEntries(lectures, TimetableEntry.TimetableEntryType.LECTURE);
			parseEntries(practicals, TimetableEntry.TimetableEntryType.PRACTICAL);

			callback();
		}
	} else {
		this.emit('error', `Cannot parse table with ${rowsCount} row(s)`)
	}
};

Timetable.prototype.beginParsing = function() {
	let self = this;
	this.isParsing = true;

	this.addMessage('Performing initial request');

	request.post('https://mytimetable.hud.ac.uk/schedule_S.aspx', {
			form: {
				stu_num: self.studentId,
			}
	}, function(err, httpResponse, body) {
		if (err) {
			self.emit('error', err);
		} else {
			self.addMessage('Parsing initial request');

			let jsDocument = jsdom(body);
			let window = jsDocument.defaultView;
			let document = window.document;

			let availableWeeksSelect = document.getElementById('ctl00_ContentPlaceHolder1_ddlWeeks');
			let viewStateInput = document.getElementById('__VIEWSTATE');
			let viewStateGeneratorInput = document.getElementById('__VIEWSTATEGENERATOR');
			let eventValidationInput = document.getElementById('__EVENTVALIDATION');
			if (availableWeeksSelect !== null && viewStateInput != null && viewStateGeneratorInput != null && eventValidationInput != null) {
				let viewState = viewStateInput.value;
				let viewStateGenerator = viewStateGeneratorInput.value;
				let eventValidation = eventValidationInput.value;
				let availableWeeksOptions = availableWeeksSelect.options;
				let optionsCount = availableWeeksOptions.length;

				self.addMessage(`Found ${optionsCount} week(s) of data`);

				var tablesParsed = 0;
				let tableParsed = function() {
					tablesParsed++;

					if (tablesParsed == optionsCount) {
						self.finish();
					}
				};

				for (var i = 0; i < optionsCount; i++) {
					let option = availableWeeksOptions[i];

					if (option.value == availableWeeksSelect.value) {
						let tableContainer = document.getElementById('ctl00_ContentPlaceHolder1_Schedule1');
						if (tableContainer !== null) {
							let table = tableContainer.firstChild;
							self.parseTimetableHTML(table, option.value, tableParsed);
						}
					} else {
						self.getDataForWeek(option.value, viewState, viewStateGenerator, eventValidation, tableParsed);
					}
				}

				if (optionsCount === 0) {
					// Couldn't find anything
					self.finish("Failed to find timetable data for supplied student number");
				}
			} else {
				self.emit('error', 'Could not find weeks select');
			}
		}
	});
};

module.exports = Timetable;