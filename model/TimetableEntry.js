"use strict";

var dateFormat = require('dateformat');
var utils = require('./utils');

let TimetableEntryType = {
	LECTURE: 1,
	PRACTICAL: 2
};

var TimetableEntry = function(entryType, startTime, endTime, moduleCode, moduleName, room, teacher) {
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

TimetableEntry.prototype.iCalRepresentation = function() {
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


	return `BEGIN:VEVENT
UID:${this.startTime.getTime()}@timetable-parser.josephduffy.co.uk
SUMMARY:${this.moduleName}
DESCRIPTION:${entryTypeName} - ${this.teacher.replace(/\,/g, '\\,')}
LOCATION:${this.room}
DTSTART;TZID=Europe/London:${dateFormat(this.startTime, dateFormatString)}
DTEND;TZID=Europe/London:${dateFormat(this.endTime, dateFormatString)}
END:VEVENT`;
};

module.exports = TimetableEntry;