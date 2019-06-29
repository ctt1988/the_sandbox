'use strict';

var Q = require('q');
var models = require('models');
var DiseasesModel = models.Diseases;
var DocumentModel = models.Document;
var documentsetup = require('./documentsetup');

var getDiseases = function(){
    var deferred = Q.defer();
    var filePath = require('path').join(__dirname, 'diseases.json');
    require('fs').readFile(filePath, 'utf8', function(err, data){
        err ? deferred.reject(err) : deferred.resolve(JSON.parse(data));
    });
    return deferred.promise;
};

var resetDatabase = function(disease){
    return Q.all([
        DiseasesModel.destroy({truncate: true}), //destroy current diseases table
        DocumentModel.destroy({truncate: true}) // destroy current document table
    ])
    .then(function(){
        return Q.all([
            DiseasesModel.sync(), // create diseases table
            DocumentModel.sync()
        ]);
    })
    .then(function(){
        return DiseasesModel.bulkCreate(disease); //create entries in diseases table
    });
};

module.exports.setupDiseasesMap = function(){
    return getDiseases()
    .then(function(disease){
        return resetDatabase(disease);
    })
    .then(function(){
        return documentsetup();
    });
};
