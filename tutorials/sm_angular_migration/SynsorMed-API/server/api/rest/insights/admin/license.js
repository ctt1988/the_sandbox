'use strict';

var _ = require('lodash');
var models = require('models');
var OrganizationModel = models.Organization;
var router = require('express').Router({mergeParams: true});

router.put('/', function(req, res){

   OrganizationModel
   .find({
       where: {
           id: req.params.oraganizationId
       }
   })
   .then(function(update){
     update.updateAttributes({
         license_count: req.body.licenseCount
     })
     .then(function(resp){
       return resp;
     });
     res.json(true);
   })
   .catch(function(e){
       logger.error(e);
       res.status(500).json(e.message);
   });
});

router.get('/', function(req, res){

   OrganizationModel
   .find({
       where: {
           id: req.params.oraganizationId
       }
   })
   .then(function(data){
     res.json(data);
   })
   .catch(function(e){
       logger.error(e);
       res.status(500).json(e.message);
   });
});

module.exports = router;
