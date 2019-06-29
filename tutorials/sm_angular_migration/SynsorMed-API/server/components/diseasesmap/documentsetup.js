'use strict';

var Q = require('q');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var models = require('models');
var DocumentModel = models.Document;
var diseaseList = require('./diseases.json');

var findDiseaseId = function(diseaseName){
    diseaseName = diseaseName.toLowerCase();
    var diseaseId;
    _.forEach(diseaseList, function(disease){
        if(disease.name == diseaseName){
            diseaseId = disease.id;
            return false;
        }
    });
    return diseaseId;
};

var getFolderFiles = function(folderPath){
    var defer = Q.defer();
    fs.readdir(folderPath, function(err, files){ // getting all files of folder
        err ? defer.reject() : defer.resolve(files);
    });
    return defer.promise;
};

var readFilesAndSave = function(folderPath, diseaseId, orgId){
    return getFolderFiles(folderPath)
    .then(function(files){
        var data = {};
        _.forEach(files, function(file){
            var filePath = path.join(folderPath, file);
            var stat = fs.statSync(filePath);
            if (stat.isFile()){
                var day = parseInt(file.split('.')[0]);
                data[day] = data[day] || [];
                data[day].push(file);
            }
        });
        var queries = [];
        _.forEach(data, function(record, day){
            var query = {};
            query.day = parseInt(day);
            query.files = JSON.stringify(record);
            query.diseases_id = diseaseId;
            query.org_id = orgId;
            queries.push(query);
        });
        return DocumentModel.bulkCreate(queries);
    });
};


var getFilesForDiseases = function(diseaseId, folderPath){
    return getFolderFiles(folderPath)
    .then(function(files){
        var tasks = [];
        _.forEach(files, function(file){
            var currentFilePath = path.join(folderPath, file);
            var stat = fs.statSync(currentFilePath);
            if (stat.isDirectory()) {
               tasks.push(readFilesAndSave(currentFilePath, diseaseId, parseInt(file)));
            }
        });
        return Q.all(tasks);
    });
};

var getBaseDirectoryPath = function(){
   return  path.join(__dirname, '../../documents');
};

module.exports = function(){
    var rootPath = getBaseDirectoryPath();
    return getFolderFiles(rootPath)
    .then(function(rootFiles){
        var orgPromises = [];
        _.forEach(rootFiles, function(rootFile){
            var rootFilePath = path.join(rootPath, rootFile);
            var stat = fs.statSync(rootFilePath);
            if(stat.isDirectory()){
               orgPromises.push(getFilesForDiseases(findDiseaseId(rootFile), rootFilePath));
            }
        });
        return Q.all(orgPromises);
    });
};
