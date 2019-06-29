'use strict';
var router = require('express').Router({mergeParams: true});
var logger = require('logger');
var Q = require('q');
var OauthMonitorTokenModel = require('models').OauthMonitorToken;
var socketComponent = require('../../../../components/sockets');

/**
 * Delete a single oauth token of monitor
 *
 * @param :oauthId , Interger , OauthMonitorToken Table id to delete
 *
 */
router.delete('/:oauthId', function (req, res) {
        req
        .monitorModel
        .getMeasurementMaps()
        .then(function(measurements){
            var queries = [];
            measurements.forEach(function(measurement){
                //unlink measurement id if connected withg oauthId
                if(measurement.oauth_id == req.params.oauthId){
                    logger.trace('Unlinking measurement '+measurement.id);
                    queries.push(measurement.updateAttributes({
                        oauth_data: null,
                        service_name: null,
                        oauth_id: null
                    }));
                }
            });
            return Q.all(queries);
        })
        .then(function(){
            //delete oauth tokens
            return OauthMonitorTokenModel.destroy({where: {id: req.params.oauthId}});
        })
        .then(function(){
            logger.trace('Deleted oauth tokens for oauthId ' +req.params.oauthId);
            socketComponent.emitData('deletedServiceFromApp', {orgId: (req.monitorModel && req.monitorModel.User) ? req.monitorModel.User.org_id : null});
            return res.json(true);
        })
        .catch(function(e){
            logger.error(e);
            res.status(500).json(e.message);
        });
});

module.exports = router;
