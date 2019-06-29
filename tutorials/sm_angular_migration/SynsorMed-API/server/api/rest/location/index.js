'use strict';

var models = require('models');
var logger = require('logger');
var router = require('express').Router();

router.post('/', function(req, res){
    if(!req.body.object_id || ! req.body.object_type) return res.status(422).send(false);

    models.GpsLocation.findOrCreate({
        where:{
            object_id: req.body.object_id,
            object_type: req.body.object_type
        }
    })
    .spread(function(obj){
        var data = req.body.object_data ? JSON.stringify(req.body.object_data) : obj.object_data;
        return obj.updateAttributes({
            object_data: data
        })
        .then(function(){
            return res.send(true);
        });
    })
    .catch(function(err){
        console.log(err);
        logger.trace(err);
        return res.status(500).send(false);
    });
});

module.exports = router;
