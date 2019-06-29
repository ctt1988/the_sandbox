'use strict';

var _ = require('lodash');
var moment = require('moment');

module.exports.getMonitorReport = function(monitorMeasurements, startDate, monitorDocumentEvents, readingEvents, orgDocuments){
    var monitorInfo = {};
    _.forEach(monitorMeasurements, function(measurement){
        var measurementInfo = getMeasurementDocumentInfo(startDate, monitorDocumentEvents, orgDocuments, measurement.diseases_id,  measurement.monitor_id);
        monitorInfo.scheduled = (monitorInfo.scheduled || 0) + measurementInfo.scheduled;
        monitorInfo.attended = (monitorInfo.attended || 0) + measurementInfo.attended;
        monitorInfo.adherence = monitorInfo.scheduled ? ((monitorInfo.attended/monitorInfo.scheduled)*100).toFixed(0) : 0;

        var measurementActivityInfo = getMeasurementActivityInfo(startDate, measurement, readingEvents);
        monitorInfo.monitored = (monitorInfo.monitored || 0) + measurementActivityInfo.monitored;
        monitorInfo.activity = (monitorInfo.activity || 0) + measurementActivityInfo.activity;
        monitorInfo.utilization = monitorInfo.monitored ? ((monitorInfo.activity/monitorInfo.monitored)*100).toFixed(0) : 0;
    });
    return monitorInfo;
};

module.exports.getMonitorMeasurements = function(monitor){
    var monitorMeasurements = [];
    _.forEach(monitor.Measurements, function(measurement){
        monitorMeasurements.push(measurement.MeasurementMonitor);
    });
    return monitorMeasurements;
};

module.exports.getOrgMeasurements = function(orgMonitors){
    var orgMeasurements = [];
    _.forEach(orgMonitors, function(monitor){
        var monitorMeasurements = module.exports.getMonitorMeasurements(monitor);
        orgMeasurements = orgMeasurements.concat(monitorMeasurements);
    });
    return orgMeasurements;
};

module.exports.getIds = function(records){
    var ids = [];
    _.forEach(records, function(record){
        if(ids.indexOf(record.id) == -1) ids.push(record.id);
    });
    return ids;
};

module.exports.getMaxDayForDiseaseId = function(records, diseasesId){
    var max = 0;
    _.forEach(records, function(record){
        if(record.diseases_id == diseasesId){
            max = record.day > max ? record.day : max;
        }
    });
    return parseInt(max);
};

var getCurrentDayActivityInfo = function(currentDayReadings, repeatWithinSeconds, prevReadingCounts){
    var monitored = 0, activity = 0, oneDay = 86400;
    if(repeatWithinSeconds > oneDay){
        prevReadingCounts.push(currentDayReadings);
        if(prevReadingCounts.length == (repeatWithinSeconds/oneDay)){
            var totalReadings = 0;
            for(var i = 0; i<prevReadingCounts.length; i++) totalReadings += prevReadingCounts[i];
            monitored++;
            prevReadingCounts = [];
            if(totalReadings) activity ++;
        }
    }
    else{
        var dayEntries = (oneDay/repeatWithinSeconds);
        monitored = monitored + (dayEntries*1);
        if(dayEntries <= currentDayReadings) activity += dayEntries;
    }
    return{monitored: monitored, activity: activity, prevReadingCounts: prevReadingCounts};
};

var getMeasurementActivityInfo = function(startDate, measurement, readingEvents){
    startDate = startDate || false;
    var monitored = 0, activity = 0;
    if(measurement.oauth_id && startDate){
        var repeatWithinSeconds = measurement.repeat_within_seconds;
        var currentDate = moment().endOf('day');
        var prevReadingCounts = [];
        for(var date = moment(startDate).startOf('day'); date.isBefore(currentDate); date.add(1, 'days')){
            var currentDayReadings = getCurrentDayReadings(readingEvents, measurement.id, date);
            var currentDayInfo = getCurrentDayActivityInfo(currentDayReadings, repeatWithinSeconds, prevReadingCounts);
            monitored = monitored + currentDayInfo.monitored;
            activity = activity + currentDayInfo.activity;
            prevReadingCounts = currentDayInfo.prevReadingCounts;
        }
    }
    return { monitored: monitored, activity: activity };
};

var getMeasurementDocumentInfo = function(startDate, events, documents, diseasesId, monitorId){
    startDate = startDate ? moment(startDate).startOf('day') : false;
    var scheduled = [], attended = [];
    if(diseasesId && startDate){
        var currentDate = moment().endOf('day');
        for (var date =  moment(startDate).startOf('day'); date.isBefore(currentDate); date.add(1, 'days')) {
            var day = date.diff(startDate, 'days') + 1;
            var maxDay = module.exports.getMaxDayForDiseaseId(documents, diseasesId);
            day = (day > maxDay ? (day % maxDay) : day) || maxDay; // set day to one if remainder of day and maxDay  return zero day
            var documentsForDay = getDocumentsForDay(documents, day, diseasesId);
            if(documentsForDay.length){
                scheduled.push(date.format());
                var readDocumentsForDay = getReadDocumentsForDay(events, date, diseasesId, monitorId);
                var unreadDocumentsForDay = _.difference(documentsForDay, readDocumentsForDay);
                if(!unreadDocumentsForDay.length){
                    for(var tempDate = moment(date).startOf('day'); tempDate.isSameOrAfter(startDate); tempDate=tempDate.subtract(maxDay, 'days')){
                        if(attended.indexOf(tempDate.format())==-1)  attended.push(tempDate.format());
                    }
                }
            }
        }
    }
    return { scheduled: scheduled.length, attended: attended.length};
};

var getDocumentsForDay = function(documents, day, diseasesId){
    var results = [];
    _.forEach(documents, function(document){
        if( (document.day == day) && (document.diseases_id == diseasesId) )  {
            results = _.union(results, JSON.parse(document.files));
        }
    });
    return results;
};

var getReadDocumentsForDay = function(events, date, diseasesId, monitorId){
    var readFiles = [];
    date = moment(date).startOf('day');
    _.forEach(events, function(event){
        var eventData = event ? JSON.parse(event.event_data) : false;
        var eventDate = eventData ? moment(eventData.read_date).startOf('day') : false;
        if(eventDate && event.object_id == monitorId && eventData.diseases_id == diseasesId && date.isSame(eventDate)){
            readFiles.push(eventData.file_name);
        }
    });
    return readFiles;
};

var getCurrentDayReadings = function(readingEvents, measurementId, date){
    var readings = 0;
    date = moment(date).startOf('day');
    _.forEach(readingEvents, function(event){
        var readingDate = moment(event.created_at).subtract(1, 'days').startOf('day');
        if(event.object_id == measurementId && date.isSame(readingDate)){
            var eventData = event.event_data ? JSON.parse(event.event_data) : {};
            readings += (eventData.readings ? eventData.readings : 0);
        }
    });
    return readings;
};

module.exports.getEduMissedForMonitor = function(monitor_id, diseases_id, startDate, events, documents){
    startDate = moment(startDate).startOf('day');
    var missed = 0, count=1, extraRead = 0;

    if(diseases_id){
        for (var date =  moment().startOf('day'); date.isSameOrAfter(startDate); date.subtract(1, 'days')) {
            var day = date.diff(startDate, 'days') + 1;
            var maxDay = module.exports.getMaxDayForDiseaseId(documents, diseases_id);
            day = day > maxDay ? (day % maxDay) : day;
            if(diseases_id){
                var documentsForDay = getDocumentsForDay(documents, day, diseases_id);
                if(documentsForDay.length){
                    var readDocumentsForDay = getReadDocumentsForDay(events, date, diseases_id, monitor_id);
                    var unreadDocumentsForDay = _.difference(documentsForDay, readDocumentsForDay);
                    var unreadsForDay = unreadDocumentsForDay.length - extraRead;
                    extraRead = ((extraRead-unreadDocumentsForDay.length) <= 0)? 0 : extraRead-unreadDocumentsForDay.length;
                    if(unreadsForDay > 0){
                        missed++;
                        count = 1;
                    }
                    else if(readDocumentsForDay.length > documentsForDay.length){
                        extraRead += readDocumentsForDay.length - documentsForDay.length;
                        count++;
                    }
                    else {
                        count++;
                    }
                    if(count > maxDay) break;
                }
            }
        }
    }

    return missed;
};
