var router = require('express').Router({mergeParams: true});
var models = require('models');
var PatientModel = models.Patient;
var UserModel = models.User;
var PatientMarshaller = require('../../../dto/patient');
var Q = require('q');
var config = require('config');
var logger = require('logger');
var _ = require('lodash');

router.get('/', function (req, res) {
  var providerId = parseInt(req.params['providerId']);
  var org_id = req.current_user.org_id;
  var currentPage = req.query.currentPage||1;
  var pageSize = req.query.pageSize||5;
  var offset = (currentPage - 1) * pageSize;
  var limit = parseInt(pageSize);
  var getCount = req.query.getCount;
  var where = ((config.seeds.roles.Admin == req.current_user.role_id) && !providerId) ? { org_id : org_id } : { id : providerId };
  var query = {
    include:[{
      model : UserModel,
      where: where
    }]
  };
  query.paranoid = (req.query.paranoid != 0) ? false : true;
  query.where = query.where || {};
  if(req.query.paranoid == 2) query.where.deleted_at = {
    $ne: null
  };

  if(req.query.searchBox){
    var searchFor = req.query.searchBox;
    var search = searchFor.split(' ');
    var wheres= {
      $or: [
        {email: {$like: '%'+searchFor+'%'}},
        {first_name: {$like: '%'+search[0]+'%'}},
        {last_name: {$like: '%'+search[0]+'%'}},
        {first_name: {$like: '%'+search[1]+'%'}},
        {last_name: {$like: '%'+search[1]+'%'}}
      ]
    };
    query = {
      where: wheres,
      include:[{
        model : UserModel,
        where: {org_id : org_id}
      }]
    };
  }
  query.order=[ ['created_at',  'DESC'] ];

  var filter = function(value){
    var start = offset;
    var end = offset+limit;
    var tosend =[];
    for(var i = start; i<end; i++) {
      if(value[i]) tosend.push(value[i]);
    }
    return tosend;
  };

  return PatientModel.findAll(query)
  .then(function (results) {

    if(getCount==false||!getCount)
    results = filter(results);
    var promises = [];
    _.forEach(results, function(result){
      promises.push(PatientMarshaller.marshal(result));
    });
    return Q.all(promises);
  })
  .then(function (patients) {
    res.json(patients);
  })
  .catch(function (error) {
    logger.trace(error.message);
    logger.error('Patient provider failed because: ' +error);
    res.status(500).end();
  });
});

module.exports = router;
