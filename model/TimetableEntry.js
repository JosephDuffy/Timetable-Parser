"use strict";

var dateFormat = require('dateformat');
var utils = require('./utils');

let TimetableEntryType = {
	LECTURE: 1,
	PRACTICAL: 2
};

var TimetableEntry = function(studentId, entryType, startTime, endTime, moduleCode, moduleName, room, teacher) {
	this.studentId = studentId;
	this.entryType = entryType;
	this.startTime = startTime;
	this.endTime = endTime;
	this.moduleCode = moduleCode;
	this.moduleName = utils.stringToTitleCase(moduleName);
	this.originalModuleName = moduleName;
	this.room = room;
	this.teacher = teacher;
};

TimetableEntry.TimetableEntryType = TimetableEntryType;

TimetableEntry.prototype.calendarId = function() {
	return `${this.startTime.getTime()}.${this.studentId}@timetable-parser.josephduffy.co.uk`
};

TimetableEntry.prototype.formattedStartDate = function() {
	return dateFormat(this.startTime, "HH:MM dd/mm/yyyy");
};

TimetableEntry.prototype.formattedEndDate = function() {
	return dateFormat(this.endTime, "HH:MM dd/mm/yyyy");
};

TimetableEntry.prototype.iCalRepresentation = function(previousEntryEndDate, doAddAlarms, alarmOffset) {
	let dateFormatString = "yyyymmdd'T'HHMMss";
	var entryTypeName;
	switch (this.entryType) {
	case TimetableEntryType.LECTURE:
		entryTypeName = "Lecture";
		break;
	case TimetableEntryType.PRACTICAL:
		entryTypeName =  "Practical";
		break;
	}

	var event = `BEGIN:VEVENT
UID:${this.calendarId()}
SUMMARY:${this.moduleName}
DESCRIPTION:${entryTypeName} - ${this.teacher.replace(/\,/g, '\\,')}
LOCATION:${this.room}
DTSTART;TZID=Europe/London:${dateFormat(this.startTime, dateFormatString)}
DTEND;TZID=Europe/London:${dateFormat(this.endTime, dateFormatString)}`;

	if (doAddAlarms && (previousEntryEndDate == null || this.startTime.getTime() !== previousEntryEndDate.getTime())) {
		let alarm = `BEGIN:VALARM
TRIGGER:-PT${alarmOffset}M
REPEAT:1
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM`;

		event = `${event}
${alarm}`;
	}

	event = `${event}
END:VEVENT`;
	return event;
};

module.exports = TimetableEntry;