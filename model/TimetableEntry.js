"use strict";

let TimetableEntryType = {
	LECTURE: 1,
	PRACTICAL: 2
};

let TimetableEntry = function(entryType, date, startTime, endTime, moduleCode, moduleName, room, teacher) {
	this.entryType = entryType;
	this.date = date;
	this.startTime = startTime;
	this.endTime = endTime;
	this.moduleCode = moduleCode;
	this.moduleName = moduleName;
	this.room = room;
	this.teacher = teacher;

};

TimetableEntry.TimetableEntryType = TimetableEntryType;

module.exports = TimetableEntry;