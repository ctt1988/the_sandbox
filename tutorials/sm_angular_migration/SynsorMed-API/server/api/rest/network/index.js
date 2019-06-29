'use strict';

var router = require('express').Router();
var logger = require('logger');

var networkModel = require('models').CellularNetwork;

router.get('/', function(req, res){
  //fetch all network providers
  networkModel.findAll().then(function(providers){
    return res.json(providers);
  }).catch(function(err){
    logger.error(err);
    res.send('Server Error');
  });
});
module.exports = router;
