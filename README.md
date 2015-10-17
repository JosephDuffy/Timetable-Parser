Timetable Parser
===

Timetable Parser is a small io.js application that will fetch and parse timetable information from the University of Huddersfield's timetable system. A functioning version can be found at [https://timetableparser.josephduffy.co.uk](https://timetableparser.josephduffy.co.uk/). It currently supports:

 - Viewing a list of a student's upcoming timetabled events
 - Creating an [iCalendar feed](https://en.wikipedia.org/wiki/ICalendar) that has an entry for each timetabled event
 - Adding alerts at a specific time for each event in the first block of events

It was created as a quick and dirty solution to allow me to export my timetable to a format that a calendar application can understand. It is not elegant and it is not good code, but it works. I have found it useful so hopefully others will, too. It also highlights the security issue that the University issue has: anyone can view someone's timetable with nothing more than their student number and basic knowledge of HTTP.

**Please note**: This project could break at any time due to it relying very heavily on the HTML structure and the security model of the timetable not changing. This is out of my control. If it does break, [file a bug](https://github.com/JosephDuffy/Timetable-Parser/issues) and I'll see what I can do.

## License

Timetable Parser is licensed under the MIT license. See the LICENSE file for more information.