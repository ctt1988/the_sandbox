'use strict';

var Q = require('q');
var _ = require('lodash');
var moment = require('moment');
var logger = require('logger');
var models = require('models');
var helpers = require('./helpers');
var router = require('express').Router({mergeParams: true});

router.get('/', function(req, res){
    var monitorModel = req.monitorModel;
    var monitorStart = monitorModel.start_date;
    if(!monitorStart){
        return res.send([]);
    }
    var documentRecords = null, diseasesIds, monitorEvents= null;

    Q.all([
        models.Document.findAll({
            include:{
                require: true,
                model: models.Diseases,
                include: {
                    require: true,
                    model: models.MeasurementMonitor,
                    include: {
                        require: true,
                        model: models.Monitor,
                        where: {
                            id: monitorModel.id
                        }
                    }
                }
            }
        }),

        models.Event.findAll({
            where: {
                object_type: 'monitor',
                object_id: monitorModel.id,
                type: 'document_read'
            }
        })
    ])
    .then(function(results){
        documentRecords = results[0];
        monitorEvents = results[1];
        diseasesIds = helpers.getDiseasesIds(documentRecords);
        return helpers.setLastResetDate(monitorModel, documentRecords, _.clone(diseasesIds) );
    })
    .then(function(){
        var documents = helpers.getAllDocuments(documentRecords, monitorModel.start_date);
        var cycleFiles = helpers.getCycleFiles(documentRecords, documents, monitorEvents, monitorModel.start_date);
        documents = helpers.combineDocuments(documents, cycleFiles, diseasesIds);
        var prevUnreadDocuments = monitorModel.unread_files ? JSON.parse(monitorModel.unread_files) : [];
        var mergedDocuments = helpers.combineDocuments(documents, prevUnreadDocuments, diseasesIds);
        var readFiles = monitorModel.read_files ? JSON.parse(monitorModel.read_files) : [];
        var unreadDocuments = helpers.combineDocuments(mergedDocuments, readFiles, diseasesIds, true);
        var finalDocuments = helpers.mapInfo(unreadDocuments, documentRecords, readFiles);
        res.send(finalDocuments);
        return monitorModel.updateAttributes({
            unread_files: JSON.stringify(unreadDocuments)
        });
    })
    .catch(function(err){
        logger.trace(err);
        console.log(err);
    });

});


router.put('/', function(req, res){
    var diseasesId = req.body.diseasesId;
    var name = req.body.fileName;
    if(!diseasesId || !name) return res.status(422).send('Validation Error');
    var previousFiles = req.monitorModel.read_files ? JSON.parse(req.monitorModel.read_files) : [];
    var fileInsertionInfo = helpers.insertNewFile(previousFiles, diseasesId, name);
    if(fileInsertionInfo.already_read) return res.send(true);
    var readFiles = fileInsertionInfo.files;
    req.monitorModel.updateAttributes({ read_files: JSON.stringify(readFiles) })
    .then(function(){
        res.send(true);
        return Q.all([
            models.Event.findAll({
                where: {
                    object_id: req.monitorModel.id,
                    object_type: 'monitor',
                    created_at: {
                        $gt: moment().startOf('day').toDate(),
                        $lt: moment().endOf('day').toDate()
                    }
                }
            }),
            models.Document.findAll({
                where: {
                    diseases_id: diseasesId,
                    org_id: req.monitorModel.User.org_id
                }
            })
        ]);
    })
    .then(function(results){
        var events = results[0];
        var documents = results[1];
        var maxDay = helpers.getMaxDayForDiseaseId(documents, diseasesId);
        var currentFileDay = helpers.getCurrentFileDay(documents, name);
        var fileReadingDate = helpers.getFileReadingDate(req.monitorModel.start_date, maxDay, currentFileDay);
        if(!helpers.isFileExistInEvent(events, name, diseasesId)){
            var data = {
                diseases_id : diseasesId,
                file_name : name,
                read_date : fileReadingDate
            };
            return models.Event.createDocumentEvent(req.monitorModel.id, data);
        }
    })
    .catch(function(err){
        logger.trace(err);
        console.log(err);
    });
});

module.exports = router;
