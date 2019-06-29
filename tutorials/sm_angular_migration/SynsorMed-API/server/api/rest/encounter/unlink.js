'use strict';

var logger = require('logger');

module.exports = function (req, res) {
    req
    .encounterModel
    .updateAttributes({
        service_name: null,
        oauth_data: null
    })
    .then(function(update){
        logger.trace('Unlink encounter ' + update.id);
        res.json(true);
    })
    .catch(function(e){
        logger.error(e);
        res.status(500).json(e.message);
    });
};
