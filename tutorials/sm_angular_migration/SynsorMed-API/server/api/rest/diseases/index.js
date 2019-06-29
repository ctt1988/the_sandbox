'use strict';

var _ = require('lodash');
var logger = require('logger');
var models = require('models');
var DiseasesModel = models.Diseases;
var DocumentModel = models.Document;
var router = require('express').Router();
var DiseasesDTO = require('../../../dto/diseases');

var getDiseases = function(orgId){
    return DiseasesModel.findAll({
        include: [
            {
                required: true,
                model: DocumentModel,
                where: {
                    org_id: orgId
                }
            }
        ]
    })
    .then(function(diseases){
       _.forEach(diseases, function(disease, index){
             diseases[index] = DiseasesDTO.marshal(disease);
       });
       return diseases;
   });
};

router.get('/', function(req, res){
    getDiseases(req.current_user.org_id)
    .then(function(diseases){
         return res.json(diseases);
    })
   .catch(function(err){
      logger.trace(err);
      console.log(err);
   });
});

router.get('/available', function(req, res){
    models.Monitor.find({where:{patient_code: req.session.monitorCode}})
    .then(function(monitorModel){
        return monitorModel.getUser({
            include: [models.Organization]
        });
    })
    .then(function(res){
        return getDiseases(res.Organization.id);
    })
    .then(function(diseases){
        var response = diseases  ? !_.isEmpty(diseases) : false;
        return res.send(response);
    })
   .catch(function(err){
      logger.trace(err);
      console.log(err);
      return res.status(500).end();
   });
});

module.exports = router;
