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
};

util.inherits(Timetable, EventEmitter);

Timetable.prototype.finished = function() {
	return this.completedTimestamp !== null;
};

Timetable.prototype.addMessage = function(message) {
	this.messages.push(message);
	this.emit('addMessage', message);
};

Timetable.prototype.getDataForWeek = function(week, callback) {
	let self = this;
	this.messages.push(`Getting data for week ${week}`);

	request.post('https://mytimetable.hud.ac.uk/schedule_S.aspx', {
			form: {
				ctl00$ContentPlaceHolder1$HF_stuNum: self.studentId,
				ctl00$ContentPlaceHolder1$ddlWeeks: week,
				'__EVENTTARGET': 'ctl00$ContentPlaceHolder1$ddlWeeks',
				'ctl00$ScriptManager1': 'ctl00$ContentPlaceHolder1$UpdatePanel1|ctl00$ContentPlaceHolder1$ddlWeeks',
				'__EVENTVALIDATION': '/wEWGgLJ4ajIBQLWsJrCDAKY28GhDAKY262hDAKb29GhDALisqSMCgLisoCMCgLlsrSMCgLkstiMCgLnsqyMCgLPqY57As6pknsC5bK8zQoC5LLIzQoCz6m+uAcCz6mSuAcCwam6uAcCwameuAcCqJ+Upw0Cq5+Apw0C7KDNuwQC7KChuwQC76D9uwQCj+j5mwECv53E3QgCxdT+lA9T8OaLBxbqw4fBzoZ39gC0oi4PcA==',
				'__VIEWSTATEGENERATOR': '18A15BD6',
				'__VIEWSTATE': '/wEPDwUKLTcwMzA2MDEyNw9kFgJmD2QWAgIDD2QWAgIDD2QWAgIFD2QWAmYPZBYGAgMPEA8WBh4ORGF0YVZhbHVlRmllbGQFB2FNb25kYXkeDURhdGFUZXh0RmllbGQFCGFEaXNwbGF5HgtfIURhdGFCb3VuZGdkEBUVCzEyIE9jdCAyMDE1CzE5IE9jdCAyMDE1CzI2IE9jdCAyMDE1CzAyIE5vdiAyMDE1CzA5IE5vdiAyMDE1CzE2IE5vdiAyMDE1CzIzIE5vdiAyMDE1CzMwIE5vdiAyMDE1CzA3IERlYyAyMDE1CzE0IERlYyAyMDE1CzE4IEphbiAyMDE2CzI1IEphbiAyMDE2CzAxIEZlYiAyMDE2CzA4IEZlYiAyMDE2CzIyIEZlYiAyMDE2CzI5IEZlYiAyMDE2CzA3IE1hciAyMDE2CzE0IE1hciAyMDE2CzExIEFwciAyMDE2CzE4IEFwciAyMDE2CzI1IEFwciAyMDE2FRUKMjAxNS0xMC0xMgoyMDE1LTEwLTE5CjIwMTUtMTAtMjYKMjAxNS0xMS0wMgoyMDE1LTExLTA5CjIwMTUtMTEtMTYKMjAxNS0xMS0yMwoyMDE1LTExLTMwCjIwMTUtMTItMDcKMjAxNS0xMi0xNAoyMDE2LTAxLTE4CjIwMTYtMDEtMjUKMjAxNi0wMi0wMQoyMDE2LTAyLTA4CjIwMTYtMDItMjIKMjAxNi0wMi0yOQoyMDE2LTAzLTA3CjIwMTYtMDMtMTQKMjAxNi0wNC0xMQoyMDE2LTA0LTE4CjIwMTYtMDQtMjUUKwMVZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnFgFmZAIJDw8WGh4OYXJySGVhZGVyQ291bnQUKwEIAgsCFQIBAgECAQIBAgFmHwJnHg5hcnJSYW5nZVZhbHVlcxYKBQUwOToxNQUFMTA6MTUFBTExOjE1BQUxMjoxNQUFMTM6MTUFBTE0OjE1BQUxNToxNQUFMTU6NDUFBTE2OjE1BQUxNzoxNR4LYXJySXRlbVJvd3MUKwEKAgYCBgIGAgYCBgIEAgICAgICZh4JSXRlbUNvdW50AgkeCVN0YXJ0RGF0ZQYAgIESmNLSCB4MTnVtYmVyT2ZEYXlzAgUeC2Fyckl0ZW1Db2xzFCsBCgIIAgcCBQIDAgICCgIJAggCBWYeC2FyckRhdGFLZXlzPCl8U3lzdGVtLkNvbGxlY3Rpb25zLlNwZWNpYWxpemVkLklPcmRlcmVkRGljdGlvbmFyeSwgU3lzdGVtLCBWZXJzaW9uPTIuMC4wLjAsIEN1bHR1cmU9bmV1dHJhbCwgUHVibGljS2V5VG9rZW49Yjc3YTVjNTYxOTM0ZTA4OQoAHghSb3dDb3VudAIHHgVFbXB0eWgeC18hSXRlbUNvdW50AgkeDGFyckNlbGxDb3VudBQrAQgCCwIVAgsCDAIMAgwCCmZkFgJmDw8WDB4LQm9yZGVyQ29sb3IKTh4LQ2VsbFBhZGRpbmcC/////w8eC0NlbGxTcGFjaW5nZh4JR3JpZExpbmVzCyojU3lzdGVtLldlYi5VSS5XZWJDb250cm9scy5HcmlkTGluZXMDHg9Ib3Jpem9udGFsQWxpZ24LKilTeXN0ZW0uV2ViLlVJLldlYkNvbnRyb2xzLkhvcml6b250YWxBbGlnbgAeBF8hU0ICkIB4ZBYOZg9kFhZmDw8WBh4IQ3NzQ2xhc3MFBXRpdGxlHgRUZXh0BQYmbmJzcDsfFAICZGQCAQ8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HgpDb2x1bW5TcGFuAgIfFAICFgIeBXN0eWxlBTZib3JkZXItcmlnaHQ6bm9uZTtib3JkZXItbGVmdDpub25lO2JvcmRlci1ib3R0b206bm9uZTsWAmYPZBYCZg8VAQUwOToxNWQCAg8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxMDoxNWQCAw8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxMToxNWQCBA8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxMjoxNWQCBQ8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxMzoxNWQCBg8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxNDoxNWQCBw8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxNToxNWQCCA8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxNTo0NWQCCQ8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxNjoxNWQCCg8PFggfFQULcmFuZ2VoZWFkZXIfFgUGJm5ic3A7HxcCAh8UAgIWAh8YBTZib3JkZXItYm90dG9tOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTsWAmYPZBYCZg8VAQUxNzoxNWQCAQ9kFipmDw8WBh8WBQYmbmJzcDsfFQUFdGl0bGUfFAICZGQCAQ8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFS2JvcmRlci1yaWdodDpzb2xpZCAxcHg7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItdG9wOm5vbmU7Ym9yZGVyLWJvdHRvbTpub25lO2QCAg8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFOGJvcmRlci10b3A6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTtib3JkZXItbGVmdDpzb2xpZCAxcHg7ZAIDDw8WBh8WBQYmbmJzcDsfFQULcmFuZ2VoZWFkZXIfFAICFgIfGAU4Ym9yZGVyLXRvcDpub25lO2JvcmRlci1sZWZ0Om5vbmU7Ym9yZGVyLXJpZ2h0OnNvbGlkIDFweDtkAgQPDxYGHxYFBiZuYnNwOx8VBQtyYW5nZWhlYWRlch8UAgIWAh8YBThib3JkZXItdG9wOm5vbmU7Ym9yZGVyLXJpZ2h0Om5vbmU7Ym9yZGVyLWxlZnQ6c29saWQgMXB4O2QCBQ8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFOGJvcmRlci10b3A6bm9uZTtib3JkZXItbGVmdDpub25lO2JvcmRlci1yaWdodDpzb2xpZCAxcHg7ZAIGDw8WBh8WBQYmbmJzcDsfFQULcmFuZ2VoZWFkZXIfFAICFgIfGAU4Ym9yZGVyLXRvcDpub25lO2JvcmRlci1yaWdodDpub25lO2JvcmRlci1sZWZ0OnNvbGlkIDFweDtkAgcPDxYGHxYFBiZuYnNwOx8VBQtyYW5nZWhlYWRlch8UAgIWAh8YBThib3JkZXItdG9wOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6c29saWQgMXB4O2QCCA8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFOGJvcmRlci10b3A6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTtib3JkZXItbGVmdDpzb2xpZCAxcHg7ZAIJDw8WBh8WBQYmbmJzcDsfFQULcmFuZ2VoZWFkZXIfFAICFgIfGAU4Ym9yZGVyLXRvcDpub25lO2JvcmRlci1sZWZ0Om5vbmU7Ym9yZGVyLXJpZ2h0OnNvbGlkIDFweDtkAgoPDxYGHxYFBiZuYnNwOx8VBQtyYW5nZWhlYWRlch8UAgIWAh8YBThib3JkZXItdG9wOm5vbmU7Ym9yZGVyLXJpZ2h0Om5vbmU7Ym9yZGVyLWxlZnQ6c29saWQgMXB4O2QCCw8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFOGJvcmRlci10b3A6bm9uZTtib3JkZXItbGVmdDpub25lO2JvcmRlci1yaWdodDpzb2xpZCAxcHg7ZAIMDw8WBh8WBQYmbmJzcDsfFQULcmFuZ2VoZWFkZXIfFAICFgIfGAU4Ym9yZGVyLXRvcDpub25lO2JvcmRlci1yaWdodDpub25lO2JvcmRlci1sZWZ0OnNvbGlkIDFweDtkAg0PDxYGHxYFBiZuYnNwOx8VBQtyYW5nZWhlYWRlch8UAgIWAh8YBThib3JkZXItdG9wOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6c29saWQgMXB4O2QCDg8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFOGJvcmRlci10b3A6bm9uZTtib3JkZXItcmlnaHQ6bm9uZTtib3JkZXItbGVmdDpzb2xpZCAxcHg7ZAIPDw8WBh8WBQYmbmJzcDsfFQULcmFuZ2VoZWFkZXIfFAICFgIfGAU4Ym9yZGVyLXRvcDpub25lO2JvcmRlci1sZWZ0Om5vbmU7Ym9yZGVyLXJpZ2h0OnNvbGlkIDFweDtkAhAPDxYGHxYFBiZuYnNwOx8VBQtyYW5nZWhlYWRlch8UAgIWAh8YBThib3JkZXItdG9wOm5vbmU7Ym9yZGVyLXJpZ2h0Om5vbmU7Ym9yZGVyLWxlZnQ6c29saWQgMXB4O2QCEQ8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFOGJvcmRlci10b3A6bm9uZTtib3JkZXItbGVmdDpub25lO2JvcmRlci1yaWdodDpzb2xpZCAxcHg7ZAISDw8WBh8WBQYmbmJzcDsfFQULcmFuZ2VoZWFkZXIfFAICFgIfGAU4Ym9yZGVyLXRvcDpub25lO2JvcmRlci1yaWdodDpub25lO2JvcmRlci1sZWZ0OnNvbGlkIDFweDtkAhMPDxYGHxYFBiZuYnNwOx8VBQtyYW5nZWhlYWRlch8UAgIWAh8YBThib3JkZXItdG9wOm5vbmU7Ym9yZGVyLWxlZnQ6bm9uZTtib3JkZXItcmlnaHQ6c29saWQgMXB4O2QCFA8PFgYfFgUGJm5ic3A7HxUFC3JhbmdlaGVhZGVyHxQCAhYCHxgFS2JvcmRlci1yaWdodDpub25lO2JvcmRlci1sZWZ0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'
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
	this.addMessage(`Getting data for week ${date}`);
	let self = this;

	let rows = table.tBodies[0].rows;
	let rowsCount = rows.length;
	if (rowsCount == 7) {
		// Start at 2 because the first row has all of the times in and
		// the seonc row has nothing (just for layout reasons I guess)
		// Yey for semantics :)
		for (var i = 2; i < 7; i++) {
			let row = rows[i];
			let daysOffset = i - 2;
			let lectures = row.getElementsByClassName('lect');
			let practicals = row.getElementsByClassName('prac');

			this.addMessage(`Found ${lectures.length} lectures`);
			this.addMessage(`Found ${practicals.length} lectures`);

			function parseEntries(entries, entryType) {
				_.forEach(entries, function(entrie) {
					let containingSpan = entrie.firstChild;
					var textNodeIndex = 0;

					var startTime, endTime, moduleCode, moduleName, room, lecturer;

					_.forEach(containingSpan.childNodes, function(childNode) {
						// TODO: Load this from a constant
						if (childNode.nodeType == 3) {
							let textValue = childNode.nodeValue.trim();

							switch (textNodeIndex) {
							case 0:
								// Time
								let timesString = textValue.split(', ')[1];
								let timeValues = timesString.split(' - ');
								startTime = timeValues[0];
								endTime = timeValues[1];
								break;
							case 1:
								// Module code
								moduleCode = textValue;
								break;
							case 2:
								// Module name
								moduleName = textValue;
								break;
							case 3:
								// Room
								room = textValue.substring(0, textValue.indexOf('Room: '));
								break;
							case 4:
								// Lecturer
								lecturer = textValue;
								break;
							}

							textNodeIndex++;
						}
					});

					let entryDate = new Date(date);
					entryDate.setDate(entryDate.getDate() + daysOffset);

					let entry = new TimetableEntry(entryType, entryDate, startTime, endTime, moduleCode, moduleName, room, lecturer);
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
			if (availableWeeksSelect !== null) {
				let availableWeeksOptions = availableWeeksSelect.options;
				let optionsCount = availableWeeksOptions.length;

				self.addMessage(`Found ${optionsCount} week(s) of data`);

				var tablesParsed = 0;
				let tableParsed = function() {
					tablesParsed++;

					if (tablesParsed == optionsCount) {
						self.completedTimestamp = new Date();
						self.emit('finish');
					}
				};

				for (var i = 0; i < optionsCount; i++) {
					let option = availableWeeksOptions[i];

					if (option.value == availableWeeksSelect.value) {
						console.log('Found current weeks: ' + option.value);
						let tableContainer = document.getElementById('ctl00_ContentPlaceHolder1_Schedule1');
						if (tableContainer !== null) {
							let table = tableContainer.firstChild;
							self.parseTimetableHTML(table, option.value, tableParsed);
						}
					} else {
						self.getDataForWeek(option.value, tableParsed);
					}
				}

				self.addMessage('Parsed initial request');
			} else {
				self.emit('error', 'Could not find weeks select');
			}
		}
	});
};

module.exports = Timetable;