'use strict';

var _ = require('lodash');
var moment = require('moment');

module.exports.getCycleFiles = function(documentRecords, documents, monitorEvents, startDate){
    var cycleRecords = [];
    var allDocuments = module.exports.getAllDocuments(documentRecords, startDate, true);
    var today = moment().startOf('day');
    var date = moment(startDate).startOf('day');
    var day = getCurrentDifferenceFromStartDate(startDate);
    _.forEach(documents, function(record){
        var maxDay = module.exports.getMaxDayForDiseaseId(documentRecords, record.diseases_id);
        var lastActivityDate = getLastActivityDate(record.diseases_id, monitorEvents);
        var diseasesDocuments = getAllDocumentsForDieseseId(allDocuments, record.diseases_id);
        if(!lastActivityDate && day > maxDay){
            cycleRecords.push(diseasesDocuments);
        }
        else{
            lastActivityDate = moment(lastActivityDate).startOf('day');
            var dayOnLastActivity = lastActivityDate.diff(date, 'days') + 1;
            dayOnLastActivity = (dayOnLastActivity > maxDay ? (dayOnLastActivity % maxDay) : dayOnLastActivity) || maxDay;
            var days = today.diff(lastActivityDate, 'days');
            var diseasesFiles = [];
            for(var i=1; i<=days; i++){
                var dayOnDate = dayOnLastActivity + i;
                dayOnDate = (dayOnDate > maxDay ? (dayOnDate % maxDay) : dayOnDate) || 1;
                var documentsForDay =  getDocumentsForDay(documentRecords, dayOnDate, record.diseases_id);
                diseasesFiles = _.union(diseasesFiles, documentsForDay);
            }
            cycleRecords.push({ diseases_id: record.diseases_id, files: diseasesFiles });
        }
    });
    return cycleRecords;
};

module.exports.isFileExistInEvent = function(events, fileName, diseasesId){
    var found = false;
    _.forEach(events, function(event){
        var eventData = JSON.parse(event.event_data);
        if( (eventData.diseases_id == diseasesId) && (eventData.file_name == fileName) ){
            found = true;
        }
    });
    return found;
};

module.exports.getDiseasesIds = function(records){
    var ids = [];
    _.forEach(records, function(record){
        if(ids.indexOf(record.diseases_id) == -1) ids.push(record.diseases_id);
    });
    return ids;
};

module.exports.getAllDocuments = function(records, startDate, all){
    var results = [];
    if(!startDate) return results;
    var day = getCurrentDifferenceFromStartDate(startDate);

    _.forEach(records, function(record){
        var maxDay = module.exports.getMaxDayForDiseaseId(records, record.diseases_id);
        var currentDay = (day > maxDay ? (day % maxDay) : day) || 1;
        if(record.day <= currentDay || all){
            var files = record.files ? JSON.parse(record.files) : [];
            var found = false;
            _.forEach(results, function(result, index){
                if(result.diseases_id == record.diseases_id){
                    results[index].files = results[index].files ? results[index].files : [];
                    results[index].files = _.union(results[index].files, files);
                    found = true;
                }
            });
            if(!found) results.push({ diseases_id: record.diseases_id, files: files });
        }
    });
    return results;
};

module.exports.setLastResetDate = function(monitorModel, records, diseasesIds){
    var lastResetDate = monitorModel.last_reset_date ? JSON.parse(monitorModel.last_reset_date) : null;
    var readFiles = monitorModel.read_files ? JSON.parse(monitorModel.read_files) : [];
    var unReadFiles = monitorModel.unread_files ? JSON.parse(monitorModel.unread_files) : [];
    unReadFiles = module.exports.combineDocuments(unReadFiles, readFiles, diseasesIds, true);
    var startDate = monitorModel.start_date || moment();
    if(!lastResetDate){
        lastResetDate = [];
        _.forEach(diseasesIds, function(diseasesId){
            var day = module.exports.getMaxDayForDiseaseId(records, diseasesId);
            lastResetDate.push({
                diseases_id: diseasesId,
                date: moment(startDate).add(day, 'days').format()
            });
        });
    }
    else{
        var today = moment().startOf('day');
        _.forEach(lastResetDate, function(record, key){
            var resetDate = moment(record.date).startOf('day');
            if(today.diff(resetDate, 'days') >= 0){
                _.forEach(readFiles, function(diseasesRecord, index){
                    if(record.diseases_id == diseasesRecord.diseases_id){
                        var isExists = diseasesIds.indexOf(diseasesRecord.diseases_id);
                        if(isExists != -1){
                            readFiles[index].files = [];
                            var day = module.exports.getMaxDayForDiseaseId(records, diseasesRecord.diseases_id);
                            lastResetDate[key].date = resetDate.add(day, 'days').format();
                            diseasesIds.splice(isExists, 1);
                        }
                    }
                });
            }
        });
    }
    return monitorModel.updateAttributes({
        read_files: JSON.stringify(readFiles),
        unread_files: JSON.stringify(unReadFiles),
        last_reset_date: JSON.stringify(lastResetDate)
    });
};

module.exports.combineDocuments = function(recordsOne, recordsTwo, diseasesIds, difference){
    var allFiles = [];
    _.forEach(diseasesIds, function(diseasesId){
        var dataOne = getRecordsOnObjectKey(recordsOne, diseasesId);
        var dataTwo = getRecordsOnObjectKey(recordsTwo, diseasesId);
        allFiles.push({
            diseases_id: diseasesId,
            files: difference ? (_.difference(dataOne, dataTwo)): (_.union(dataOne, dataTwo))
        });
    });
    return allFiles;
};

module.exports.insertNewFile = function(array, diseasesId, file){
    array = array.length ? array : [{diseases_id: diseasesId}];
    var found = false;
    var alreadyRead = false;
    _.forEach(array, function(record, index){
        if(record.diseases_id == diseasesId){
            record.files = record.files ? record.files : [];
            if(record.files.indexOf(file) == -1) record.files.push(file);
            else alreadyRead = true;
            array[index].files = record.files;
            found = true;
        }
    });
    if(!found) array.push({ diseases_id: diseasesId, files: [file] });
    return {already_read: alreadyRead, files: array};
};

module.exports.mapInfo = function(documents, records, readFiles){
    _.forEach(documents, function(document, index){
        documents[index].disease_name = getDiseasesName(records, document.diseases_id);
        documents[index].read_files = getReadFiles(readFiles, document.diseases_id);
    });
    return documents;
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

module.exports.getCurrentFileDay = function(records, fileName){
    var day = 0;
    _.forEach(records, function(record){
        var files = record.files ? JSON.parse(record.files) : [];
        if(files.indexOf(fileName) != -1) day = record.day;
    });
    return parseInt(day);
};

module.exports.getFileReadingDate = function(startDate, maxDay, currentFileDay){
    var day = getCurrentDifferenceFromStartDate(startDate);
    var currentDay = (day > maxDay ? (day % maxDay) : day) || maxDay;
    var currentCycle = currentFileDay <= currentDay; //in curretn cycle or last
    var readDate = moment().subtract(currentDay, 'days');
    if (currentCycle) readDate.add(currentFileDay, 'days');
    else readDate.subtract(maxDay - currentFileDay, 'days');
    return readDate.format();
};

var getCurrentDifferenceFromStartDate = function(startDate){
    if(!startDate) return false;
    var today = moment().startOf('day');
    startDate = moment(startDate).startOf('day');
    return (today.diff(startDate, 'days') + 1);
};

var getDiseasesName = function(records, diseasesId){
    var diseaseName;
    _.forEach(records, function(record){
        diseaseName = record.diseases_id == diseasesId ? record.Disease.name : diseaseName;
    });
    return diseaseName;
};

var getReadFiles = function(readFiles, diseasesId){
    var files = [];
    _.forEach(readFiles, function(record){
        files = record.diseases_id == diseasesId ? (_.union(files, record.files)) : files;
    });
    return files;
};

var getRecordsOnObjectKey = function(records, diseasesId){
    var result = [];
    _.forEach(records, function(record){
        result = (record.diseases_id == diseasesId) ? record.files : result;
    });
    return result;
};

var getLastActivityDate = function(diseasesId, monitorEvents){
    if(!monitorEvents || !monitorEvents.length) return null;
    var info = null;
    _.forEach(monitorEvents, function(event){
        var eventData = JSON.parse(event.event_data);
        if(eventData.diseases_id == diseasesId) info = event.created_at;
    });
    return info;
};

var getAllDocumentsForDieseseId = function(allDocuments, diseasesId){
    if(!allDocuments || !allDocuments.length) return false;
    var record = null;
    _.forEach(allDocuments, function(document){
        if(document.diseases_id == diseasesId) record = document;
    });
    return record;
};

var getDocumentsForDay = function(documentRecords, day, diseasesId){
    var results = [];
    _.forEach(documentRecords, function(document){
        if( (document.day == day) && (document.diseases_id == diseasesId) )  {
            results = _.union(results, JSON.parse(document.files));
        }
    });
    return results;
};
